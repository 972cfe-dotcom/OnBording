// Documents management API endpoint
const { Pool } = require('pg');
const { verifyToken } = require('./auth-verify');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verify authentication
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה - נדרש login' })
      };
    }

    const auth = await verifyToken(token);
    if (!auth.success) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'טוקן לא תקף' })
      };
    }

    const currentUser = auth.user;

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await handleGetDocuments(currentUser, event, headers);
      case 'POST':
        return await handleUploadDocument(currentUser, event, headers);
      case 'PUT':
        return await handleUpdateDocument(currentUser, event, headers);
      case 'DELETE':
        return await handleDeleteDocument(currentUser, event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

  } catch (error) {
    console.error('Documents API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'שגיאה פנימית בשרת',
        details: error.message
      })
    };
  }
};

// Get documents
async function handleGetDocuments(currentUser, event, headers) {
  const { document_id, employee_id, document_type, status, limit = 50, offset = 0 } = event.queryStringParameters || {};

  let query = `
    SELECT d.*, dt.type_name as document_type_name,
           e.first_name, e.last_name, e.employee_number,
           u.username as uploaded_by_name
    FROM documents d
    LEFT JOIN document_types dt ON d.document_type_id = dt.type_id
    LEFT JOIN employees e ON d.employee_id = e.employee_id
    LEFT JOIN users u ON d.uploaded_by = u.user_id
    WHERE 1=1
  `;
  
  const queryParams = [];
  let paramIndex = 1;

  // Filter by specific document
  if (document_id) {
    query += ` AND d.document_id = $${paramIndex++}`;
    queryParams.push(document_id);
  }

  // Role-based access control
  if (currentUser.role === 'employee') {
    // Employees can only see their own documents or public ones
    query += ` AND (d.employee_id IN (
      SELECT employee_id FROM employees WHERE user_id = $${paramIndex++}
    ) OR d.visibility = 'public')`;
    queryParams.push(currentUser.user_id);
  } else if (employee_id) {
    // Admin/HR can filter by specific employee
    query += ` AND d.employee_id = $${paramIndex++}`;
    queryParams.push(employee_id);
  }

  // Filter by document type
  if (document_type) {
    query += ` AND d.document_type_id = $${paramIndex++}`;
    queryParams.push(document_type);
  }

  // Filter by status
  if (status) {
    query += ` AND d.status = $${paramIndex++}`;
    queryParams.push(status);
  }

  // Add ordering and pagination
  query += ` ORDER BY d.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  queryParams.push(parseInt(limit), parseInt(offset));

  const result = await pool.query(query, queryParams);

  // Get total count for pagination
  let countQuery = query.replace(/SELECT d\.\*, dt\.type_name.*?FROM/, 'SELECT COUNT(*) FROM');
  countQuery = countQuery.replace(/ORDER BY.*?LIMIT.*?OFFSET.*$/, '');
  const countParams = queryParams.slice(0, -2); // Remove limit and offset
  
  const countResult = await pool.query(countQuery, countParams);
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      documents: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    })
  };
}

// Upload document (metadata only - file handling will be added later)
async function handleUploadDocument(currentUser, event, headers) {
  const documentData = JSON.parse(event.body || '{}');
  const {
    employee_id, document_type_id, original_filename, file_size, file_type, 
    mime_type, visibility = 'private', metadata = {}
  } = documentData;

  // Validate required fields
  if (!original_filename || !file_size || !file_type) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'חסרים פרטי הקובץ הבסיסיים' })
    };
  }

  // Check file size limit
  const maxSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '25');
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file_size > maxSizeBytes) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: `גודל הקובץ חורג מהמגבלה של ${maxSizeMB}MB` 
      })
    };
  }

  // Validate file type
  const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,jpg,jpeg,png,txt').split(',');
  if (!allowedTypes.includes(file_type.toLowerCase())) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: `סוג קובץ לא נתמך: ${file_type}. סוגים נתמכים: ${allowedTypes.join(', ')}` 
      })
    };
  }

  // Check permissions for employee_id
  if (employee_id && currentUser.role === 'employee') {
    // Employees can only upload to their own record
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [currentUser.user_id]
    );
    
    if (employeeResult.rows.length === 0 || employeeResult.rows[0].employee_id !== employee_id) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה להעלות מסמך עבור עובד זה' })
      };
    }
  }

  // Generate stored filename (for future file storage implementation)
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = original_filename.split('.').pop();
  const stored_filename = `${timestamp}_${randomString}.${fileExtension}`;
  const file_path = `/documents/${stored_filename}`; // This will be updated when we add real storage

  // Generate checksum placeholder (will be real when we handle actual files)
  const checksum = `temp_${timestamp}_${randomString}`;

  // Insert document record
  const insertQuery = `
    INSERT INTO documents (
      employee_id, document_type_id, uploaded_by, original_filename, 
      stored_filename, file_path, file_size, file_type, mime_type, 
      checksum, visibility, metadata, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'uploaded')
    RETURNING *
  `;

  const insertValues = [
    employee_id || null, document_type_id || null, currentUser.user_id,
    original_filename, stored_filename, file_path, file_size, file_type,
    mime_type || 'application/octet-stream', checksum, visibility,
    JSON.stringify(metadata)
  ];

  const result = await pool.query(insertQuery, insertValues);
  const newDocument = result.rows[0];

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) 
     VALUES ($1, 'UPLOAD', 'document', $2, $3)`,
    [currentUser.user_id, newDocument.document_id, JSON.stringify(newDocument)]
  );

  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'מסמך הועלה בהצלחה',
      document: newDocument,
      upload_info: {
        stored_filename,
        file_path,
        note: 'קובץ נשמר זמנית במערכת. בעתיד יועבר לאחסון חיצוני.'
      }
    })
  };
}

// Update document metadata
async function handleUpdateDocument(currentUser, event, headers) {
  const documentData = JSON.parse(event.body || '{}');
  const { document_id, document_type_id, visibility, status, metadata, extracted_text } = documentData;

  if (!document_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה מסמך נדרש' })
    };
  }

  // Get current document data and check permissions
  const currentDoc = await pool.query('SELECT * FROM documents WHERE document_id = $1', [document_id]);
  if (currentDoc.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'מסמך לא נמצא' })
    };
  }

  const document = currentDoc.rows[0];

  // Check permissions
  if (currentUser.role === 'employee') {
    // Check if document belongs to current user's employee record
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [currentUser.user_id]
    );
    
    if (employeeResult.rows.length === 0 || 
        (document.employee_id && document.employee_id !== employeeResult.rows[0].employee_id)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה לעדכן מסמך זה' })
      };
    }
    
    // Employees can only update limited fields
    if (status && !['uploaded', 'ready'].includes(status)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה לשנות סטטוס זה' })
      };
    }
  }

  // Build update query
  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (document_type_id !== undefined) {
    updates.push(`document_type_id = $${paramIndex++}`);
    values.push(document_type_id);
  }
  
  if (visibility !== undefined) {
    updates.push(`visibility = $${paramIndex++}`);
    values.push(visibility);
  }
  
  if (status !== undefined) {
    updates.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  
  if (metadata !== undefined) {
    updates.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(metadata));
  }
  
  if (extracted_text !== undefined) {
    updates.push(`extracted_text = $${paramIndex++}`);
    values.push(extracted_text);
  }

  if (updates.length === 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'לא נבחרו שדות לעדכון' })
    };
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(document_id);

  const updateQuery = `
    UPDATE documents SET ${updates.join(', ')} 
    WHERE document_id = $${paramIndex}
    RETURNING *
  `;

  const result = await pool.query(updateQuery, values);

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values) 
     VALUES ($1, 'UPDATE', 'document', $2, $3, $4)`,
    [currentUser.user_id, document_id, JSON.stringify(document), JSON.stringify(result.rows[0])]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'מסמך עודכן בהצלחה',
      document: result.rows[0]
    })
  };
}

// Delete document
async function handleDeleteDocument(currentUser, event, headers) {
  const { document_id } = JSON.parse(event.body || '{}');

  if (!document_id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'מזהה מסמך נדרש' })
    };
  }

  // Get document data and check permissions
  const documentData = await pool.query('SELECT * FROM documents WHERE document_id = $1', [document_id]);
  if (documentData.rows.length === 0) {
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'מסמך לא נמצא' })
    };
  }

  const document = documentData.rows[0];

  // Check permissions
  if (currentUser.role === 'employee') {
    const employeeResult = await pool.query(
      'SELECT employee_id FROM employees WHERE user_id = $1',
      [currentUser.user_id]
    );
    
    if (employeeResult.rows.length === 0 || 
        (document.employee_id && document.employee_id !== employeeResult.rows[0].employee_id)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'אין הרשאה למחוק מסמך זה' })
      };
    }
  }

  // Soft delete - change status to archived
  await pool.query(
    'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE document_id = $2',
    ['archived', document_id]
  );

  // Log the action
  await pool.query(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values) 
     VALUES ($1, 'DELETE', 'document', $2, $3)`,
    [currentUser.user_id, document_id, JSON.stringify(document)]
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      message: 'מסמך הועבר לארכיון בהצלחה'
    })
  };
}