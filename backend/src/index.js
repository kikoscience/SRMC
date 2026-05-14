const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
const port = process.env.PORT || 5001;

const config = {
  user: 'sa',
  password: 'Rfx14w.14w.',
  server: '10.0.1.90',
  database: 'srms_db',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

app.use(cors());
app.use(express.json());

// Database Initialization with Retries
const initDb = async () => {
  let authenticated = false;
  let retries = 10;

  console.log('Waiting for MSSQL to start...');

  while (!authenticated && retries > 0) {
    try {
      const pool = await sql.connect(config);

      // Create database if not exists
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'srms_db')
        BEGIN
          CREATE DATABASE srms_db;
        END
      `);
      await sql.close();

      // Reconnect to srms_db
      const dbConfig = { ...config, database: 'srms_db' };
      const dbPool = await sql.connect(dbConfig);

      // Users Table
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND type in (N'U'))
        BEGIN
          CREATE TABLE users (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            role NVARCHAR(50) NOT NULL,
            department NVARCHAR(100),
            provider_type NVARCHAR(50)
          );
        END
      `);

      // Requests Table
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND type in (N'U'))
        BEGIN
          CREATE TABLE requests (
            id INT IDENTITY(1,1) PRIMARY KEY,
            tracking_no NVARCHAR(50) UNIQUE NOT NULL,
            title NVARCHAR(255) NOT NULL,
            description NVARCHAR(MAX),
            requested_by NVARCHAR(255),
            priority NVARCHAR(50) DEFAULT 'Medium',
            status NVARCHAR(50) DEFAULT 'Pending Review',
            location NVARCHAR(255),
            requester_id INT FOREIGN KEY REFERENCES users(id),
            provider_type NVARCHAR(50),
            created_at DATETIME DEFAULT GETDATE()
          );
        END
      `);

      // Migration for requested_by and assignments
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'requested_by')
        BEGIN
          ALTER TABLE requests ADD requested_by NVARCHAR(255);
        END
        
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'assigned_staff_id')
        BEGIN
          ALTER TABLE requests ADD assigned_staff_id INT;
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'workflow_step')
        BEGIN
          ALTER TABLE requests ADD workflow_step INT DEFAULT 1;
        END

        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'technical_notes')
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'attachment_url')
          BEGIN
            ALTER TABLE requests ADD attachment_url NVARCHAR(MAX);
          END
          
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'completion_attachment_url')
          BEGIN
            ALTER TABLE requests ADD completion_attachment_url NVARCHAR(MAX);
          END
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'is_nudged')
        BEGIN
          ALTER TABLE requests ADD is_nudged BIT DEFAULT 0;
          ALTER TABLE requests ADD last_nudge_at DATETIME;
        END
      `);

      // Equipment Table (Internal)
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[equipment]') AND type in (N'U'))
        BEGIN
          CREATE TABLE equipment (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name NVARCHAR(255) NOT NULL,
            property_no NVARCHAR(100) UNIQUE,
            serial_no NVARCHAR(100),
            location NVARCHAR(255),
            last_service_at DATETIME
          );
        END

        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[equipment]') AND name = 'model')
        BEGIN
          ALTER TABLE equipment ADD model NVARCHAR(255);
        END
      `);

      // Link Request to Equipment
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[request_assets]') AND type in (N'U'))
        BEGIN
          CREATE TABLE request_assets (
            id INT IDENTITY(1,1) PRIMARY KEY,
            request_id INT FOREIGN KEY REFERENCES requests(id),
            equipment_id INT FOREIGN KEY REFERENCES equipment(id)
          );
        END
      `);

      // Assignments
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[assignments]') AND type in (N'U'))
        BEGIN
          CREATE TABLE assignments (
            id INT IDENTITY(1,1) PRIMARY KEY,
            request_id INT FOREIGN KEY REFERENCES requests(id),
            staff_id INT FOREIGN KEY REFERENCES users(id),
            assigned_at DATETIME DEFAULT GETDATE()
          );
        END

        -- Request Comments Table
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[request_comments]') AND type in (N'U'))
        BEGIN
          CREATE TABLE request_comments (
            id INT IDENTITY(1,1) PRIMARY KEY,
            request_id INT FOREIGN KEY REFERENCES requests(id),
            user_name NVARCHAR(255) NOT NULL,
            user_role NVARCHAR(50),
            comment NVARCHAR(MAX) NOT NULL,
            created_at DATETIME DEFAULT GETDATE()
          );
        END
      `);

      // Add rating and feedback columns to requests
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('requests') AND name = 'rating')
        BEGIN
          ALTER TABLE requests ADD rating INT NULL;
          ALTER TABLE requests ADD feedback NVARCHAR(MAX) NULL;
        END
      `);

      // Technical Logs for multi-step documentation
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[technical_logs]') AND type in (N'U'))
        BEGIN
          CREATE TABLE technical_logs (
            id INT IDENTITY(1,1) PRIMARY KEY,
            request_id INT FOREIGN KEY REFERENCES requests(id),
            staff_id INT FOREIGN KEY REFERENCES users(id),
            notes NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
          );
        END
      `);
    
      // Parts Replacement tracking
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[parts_replacement]') AND type in (N'U'))
        BEGIN
          CREATE TABLE parts_replacement (
            id INT IDENTITY(1,1) PRIMARY KEY,
            request_id INT FOREIGN KEY REFERENCES requests(id),
            equipment_id INT FOREIGN KEY REFERENCES equipment(id),
            part_name NVARCHAR(255),
            serial_no NVARCHAR(255),
            created_at DATETIME DEFAULT GETDATE()
          );
        END
      `);

    // Granular Migrations for Users Table
    const userColumns = [
      { name: 'first_name', type: 'NVARCHAR(100)' },
      { name: 'middle_name', type: 'NVARCHAR(100)' },
      { name: 'last_name', type: 'NVARCHAR(100)' },
      { name: 'suffix', type: 'NVARCHAR(20)' },
      { name: 'employee_id', type: 'NVARCHAR(50)' },
      { name: 'position', type: 'NVARCHAR(100)' },
      { name: 'belongs_to_provider_type', type: 'NVARCHAR(50)' },
      { name: 'is_active', type: 'BIT DEFAULT 1' }
    ];

    for (const col of userColumns) {
      await dbPool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[users]') AND name = '${col.name}')
        BEGIN
          ALTER TABLE users ADD ${col.name} ${col.type};
        END
      `);
    }

    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[requests]') AND name = 'attachment_url')
      BEGIN
        ALTER TABLE requests ADD attachment_url NVARCHAR(MAX);
      END
    `);

    // Fix Duplicate Employee IDs before applying constraint
    await dbPool.request().query(`
      UPDATE users 
      SET employee_id = employee_id + '-' + CAST(id as NVARCHAR(10))
      WHERE employee_id IN (
        SELECT employee_id FROM users GROUP BY employee_id HAVING COUNT(*) > 1
      )
    `);

    // Add unique constraint to employee_id
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UQ_EmployeeID' AND type = 'UQ')
      BEGIN
        ALTER TABLE users ADD CONSTRAINT UQ_EmployeeID UNIQUE (employee_id);
      END
    `);

    // Seed Demo Users
    await dbPool.request().query(`
      IF NOT EXISTS (SELECT * FROM users WHERE id = 1)
      BEGIN
        SET IDENTITY_INSERT users ON;
        INSERT INTO users (id, name, role, department) VALUES (1, 'Demo Requester', 'REQUESTER', 'General Services');
        INSERT INTO users (id, name, role, provider_type) VALUES (2, 'IT Management', 'PROVIDER', 'IT');
        INSERT INTO users (id, name, role, provider_type) VALUES (3, 'Engineering Management', 'PROVIDER', 'Engineering');
        
        -- IT Staff
        INSERT INTO users (id, name, first_name, last_name, role, employee_id, position, belongs_to_provider_type, is_active) 
        VALUES (4, 'John Technician', 'John', 'Technician', 'STAFF', 'IT-001', 'Senior Technician', 'IT', 1);
        
        -- Engineering Staff
        INSERT INTO users (id, name, first_name, last_name, role, employee_id, position, belongs_to_provider_type, is_active) 
        VALUES (5, 'Sarah Engineer', 'Sarah', 'Engineer', 'STAFF', 'ENG-001', 'Lead Engineer', 'Engineering', 1);
        
        SET IDENTITY_INSERT users OFF;
      END
    `);

      console.log('MSSQL Database schema initialized successfully');
      authenticated = true;
    } catch (err) {
      console.log(`Connection attempt failed. Retries left: ${retries}. Error: ${err.message}`);
      retries -= 1;
      await new Promise(res => setTimeout(res, 5000)); // Wait 5s before retry
    }
  }
};

initDb();

// Endpoints
app.get('/', (req, res) => {
  res.send('<h1>SRMS API (MSSQL)</h1><p>Status: Online</p><p>Endpoints: /api/health, /api/requests</p>');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SRMS API (MSSQL) is running' });
});

app.get('/api/staff', async (req, res) => {
  const { provider_type } = req.query;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    let query = 'SELECT id, first_name, middle_name, last_name, suffix, employee_id, position, is_active FROM users WHERE role = \'STAFF\'';
    const request = pool.request();
    
    if (provider_type) {
      query += ' AND belongs_to_provider_type = @provider_type';
      request.input('provider_type', sql.NVarChar, provider_type);
    }
    
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/staff', async (req, res) => {
  const { first_name, middle_name, last_name, suffix, employee_id, position, provider_type } = req.body;
  const fullName = `${first_name} ${last_name}`.trim();
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('name', sql.NVarChar, fullName)
      .input('first_name', sql.NVarChar, first_name)
      .input('middle_name', sql.NVarChar, middle_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('suffix', sql.NVarChar, suffix)
      .input('employee_id', sql.NVarChar, employee_id)
      .input('position', sql.NVarChar, position)
      .input('provider_type', sql.NVarChar, provider_type)
      .query(`
        INSERT INTO users (name, first_name, middle_name, last_name, suffix, employee_id, position, role, belongs_to_provider_type, is_active)
        VALUES (@name, @first_name, @middle_name, @last_name, @suffix, @employee_id, @position, 'STAFF', @provider_type, 1)
      `);
    res.json({ message: 'Staff member created successfully' });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      res.status(400).json({ error: 'Duplicate Employee ID: This ID is already registered to another staff member.' });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put('/api/staff/:id/toggle', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE users SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = @id');
    res.json({ message: 'Staff status toggled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests', async (req, res) => {
  const { provider_type, staff_id } = req.query;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    
    // Subquery to get concatenated staff names for each request
    let query = `
      SELECT r.*, 
      (SELECT STRING_AGG(u.first_name + ' ' + u.last_name, ', ') 
       FROM assignments a 
       JOIN users u ON a.staff_id = u.id 
       WHERE a.request_id = r.id) as assigned_names
      FROM requests r
    `;
    
    const request = pool.request();
    
    if (staff_id) {
      query += ' JOIN assignments a_main ON r.id = a_main.request_id WHERE a_main.staff_id = @staff_id';
      request.input('staff_id', sql.Int, staff_id);
      if (provider_type) {
        query += ' AND r.provider_type = @provider_type';
        request.input('provider_type', sql.NVarChar, provider_type);
      }
    } else if (provider_type) {
      query += ' WHERE r.provider_type = @provider_type';
      request.input('provider_type', sql.NVarChar, provider_type);
    }
    
    query += ' ORDER BY r.created_at DESC';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', upload.single('attachment'), async (req, res) => {
  const { title, description, priority, location, requester_id, provider_type, requested_by } = req.body;
  const attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
  const tracking_no = `SR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('tracking_no', sql.NVarChar, tracking_no)
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description)
      .input('requested_by', sql.NVarChar, requested_by)
      .input('priority', sql.NVarChar, priority)
      .input('location', sql.NVarChar, location)
      .input('requester_id', sql.Int, requester_id)
      .input('provider_type', sql.NVarChar, provider_type)
      .input('attachment_url', sql.NVarChar, attachment_url)
      .query(`
        INSERT INTO requests (tracking_no, title, description, requested_by, priority, location, requester_id, provider_type, attachment_url)
        OUTPUT INSERTED.*
        VALUES (@tracking_no, @title, @description, @requested_by, @priority, @location, @requester_id, @provider_type, @attachment_url)
      `);
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/accept', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE requests SET status = \'Accepted\' WHERE id = @id');
    res.json({ message: 'Request accepted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const { staff_ids } = req.body;
  if (!staff_ids || staff_ids.length === 0) {
    return res.status(400).json({ error: 'No staff members selected' });
  }

  try {
    const pool = await sql.connect(config);
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      // 1. Update Request
      const updateReq = transaction.request();
      updateReq.input('id', sql.Int, id);
      updateReq.input('first_staff', sql.Int, staff_ids[0]);
      await updateReq.query('UPDATE requests SET status = \'Assigned\', assigned_staff_id = @first_staff WHERE id = @id');
      
      // 2. Refresh Assignments
      const deleteReq = transaction.request();
      deleteReq.input('rid', sql.Int, id);
      await deleteReq.query('DELETE FROM assignments WHERE request_id = @rid');
      
      for (const sid of staff_ids) {
        const insertReq = transaction.request();
        insertReq.input('rid', sql.Int, id);
        insertReq.input('sid', sql.Int, sid);
        await insertReq.query('INSERT INTO assignments (request_id, staff_id) VALUES (@rid, @sid)');
      }
      
      await transaction.commit();
      res.json({ message: 'Technical team dispatched successfully' });
    } catch (err) {
      await transaction.rollback();
      res.status(500).json({ error: 'Database Transaction Failed: ' + err.message });
    }
  } catch (err) {
    res.status(500).json({ error: 'Connection Failed: ' + err.message });
  }
});

app.put('/api/requests/:id/step', async (req, res) => {
  const { id } = req.params;
  const { step, notes } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('step', sql.Int, step)
      .input('notes', sql.NVarChar, notes)
      .query('UPDATE requests SET workflow_step = @step, technical_notes = @notes WHERE id = @id');
    res.json({ message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/logs', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT l.*, u.name as staff_name FROM technical_logs l JOIN users u ON l.staff_id = u.id WHERE l.request_id = @id ORDER BY l.created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/logs', async (req, res) => {
  const { id } = req.params;
  const { staff_id, notes } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('request_id', sql.Int, id)
      .input('staff_id', sql.Int, staff_id)
      .input('notes', sql.NVarChar, notes)
      .query('INSERT INTO technical_logs (request_id, staff_id, notes) VALUES (@request_id, @staff_id, @notes)');
    res.json({ message: 'Log entry added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/requests/:id/parts/:partId', async (req, res) => {
  const { id, partId } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('rid', sql.Int, id)
      .input('pid', sql.Int, partId)
      .query('DELETE FROM parts_replacement WHERE id = @pid AND request_id = @rid');
    res.json({ message: 'Part replacement removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/parts', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('rid', sql.Int, id)
      .query('SELECT * FROM parts_replacement WHERE request_id = @rid ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/parts', async (req, res) => {
  const { id } = req.params;
  const { part_name, serial_no } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    // Get equipment_id from request_assets
    const assetResult = await pool.request()
      .input('rid', sql.Int, id)
      .query('SELECT TOP 1 equipment_id FROM request_assets WHERE request_id = @rid');
    
    if (assetResult.recordset.length === 0) {
      return res.status(400).json({ error: 'No asset linked to this request' });
    }
    
    const equipmentId = assetResult.recordset[0].equipment_id;
    
    await pool.request()
      .input('rid', sql.Int, id)
      .input('eid', sql.Int, equipmentId)
      .input('name', sql.NVarChar, part_name)
      .input('sn', sql.NVarChar, serial_no)
      .query('INSERT INTO parts_replacement (request_id, equipment_id, part_name, serial_no) VALUES (@rid, @eid, @name, @sn)');
    
    res.json({ message: 'Part replacement recorded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.put('/api/requests/:id/complete', upload.single('completion_image'), async (req, res) => {
  const { id } = req.params;
  const completion_attachment_url = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('url', sql.NVarChar, completion_attachment_url)
      .query('UPDATE requests SET status = \'Completed\', completion_attachment_url = @url WHERE id = @id');
    res.json({ message: 'Job completed with proof' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, rating, feedback } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .input('rating', sql.Int, rating || null)
      .input('feedback', sql.NVarChar, feedback || null)
      .query('UPDATE requests SET status = @status, rating = @rating, feedback = @feedback WHERE id = @id');
    res.json({ message: 'Status updated with feedback' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/requests/:id/step', async (req, res) => {
  const { id } = req.params;
  const { step } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('step', sql.Int, step)
      .query('UPDATE requests SET workflow_step = @step WHERE id = @id');
    res.json({ message: 'Workflow step updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/staff', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.id, u.first_name, u.last_name, u.position 
        FROM users u 
        JOIN assignments a ON u.id = a.staff_id 
        WHERE a.request_id = @id
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/requests/:id/logs', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('rid', sql.Int, id)
      .query('SELECT * FROM technical_logs WHERE request_id = @rid ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/finalize', async (req, res) => {
  const { id } = req.params;
  const { report } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('report', sql.NVarChar, report)
      .query("UPDATE requests SET status = 'Closed', technical_notes = @report, workflow_step = 5 WHERE id = @id");
    res.json({ message: 'Job finalized and closed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/equipment', async (req, res) => {
  const { provider_type } = req.query;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('ptype', sql.NVarChar, provider_type)
      .query(`
        SELECT DISTINCT e.* 
        FROM equipment e
        LEFT JOIN request_assets ra ON e.id = ra.equipment_id
        LEFT JOIN requests r ON ra.request_id = r.id
        WHERE (@ptype IS NULL OR r.provider_type = @ptype)
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .query(`
        SELECT l.*, r.tracking_no, r.title, s.first_name, s.last_name 
        FROM technical_logs l
        JOIN requests r ON l.request_id = r.id
        LEFT JOIN staff s ON l.staff_id = s.id
        ORDER BY l.created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analytics/staff', async (req, res) => {
  const { provider_type } = req.query;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('ptype', sql.NVarChar, provider_type)
      .query(`
        SELECT 
          u.id,
          u.name,
          u.position,
          u.employee_id,
          (SELECT COUNT(*) FROM assignments a JOIN requests r ON a.request_id = r.id 
           WHERE a.staff_id = u.id AND r.status = 'Closed' 
           AND MONTH(r.created_at) = MONTH(GETDATE()) AND YEAR(r.created_at) = YEAR(GETDATE())) as monthly_jobs,
          (SELECT COUNT(*) FROM assignments a JOIN requests r ON a.request_id = r.id 
           WHERE a.staff_id = u.id AND r.status = 'Closed') as total_jobs,
          (SELECT AVG(CAST(r.rating AS FLOAT)) FROM assignments a JOIN requests r ON a.request_id = r.id 
           WHERE a.staff_id = u.id AND r.status = 'Closed' AND r.rating IS NOT NULL) as avg_rating,
          (SELECT COUNT(*) FROM assignments a JOIN requests r ON a.request_id = r.id 
           WHERE a.staff_id = u.id AND r.status = 'Assigned') as active_load
        FROM users u
        WHERE u.role = 'STAFF' AND (@ptype IS NULL OR u.belongs_to_provider_type = @ptype)
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/tag', async (req, res) => {
  const { id } = req.params;
  const { asset_name, model, serial_no, property_no, location_tag } = req.body;
  
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    
    try {
      // 1. Create or Update Equipment (using property_no as unique identifier)
      const equipResult = await transaction.request()
        .input('name', sql.NVarChar, asset_name)
        .input('model', sql.NVarChar, model || '')
        .input('serial_no', sql.NVarChar, serial_no || '')
        .input('property_no', sql.NVarChar, property_no)
        .input('location', sql.NVarChar, location_tag || '')
        .query(`
          IF NOT EXISTS (SELECT * FROM equipment WHERE property_no = @property_no)
          BEGIN
            INSERT INTO equipment (name, model, serial_no, property_no, location)
            OUTPUT INSERTED.id
            VALUES (@name, @model, @serial_no, @property_no, @location)
          END
          ELSE
          BEGIN
            UPDATE equipment SET name = @name, model = @model, serial_no = @serial_no, location = @location
            OUTPUT INSERTED.id
            WHERE property_no = @property_no
          END
        `);
      
      const equipmentId = equipResult.recordset[0].id;

      // 2. Link to Request
      await transaction.request()
        .input('request_id', sql.Int, id)
        .input('equipment_id', sql.Int, equipmentId)
        .query(`
          IF NOT EXISTS (SELECT * FROM request_assets WHERE request_id = @request_id AND equipment_id = @equipment_id)
          BEGIN
            INSERT INTO request_assets (request_id, equipment_id) VALUES (@request_id, @equipment_id);
          END
        `);

      await transaction.commit();
      res.json({ message: 'Asset tagged' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/nudge', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE requests SET is_nudged = 1, last_nudge_at = GETDATE() WHERE id = @id');
    res.json({ message: 'Request nudged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/nudge/reset', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE requests SET is_nudged = 0 WHERE id = @id');
    res.json({ message: 'Nudge status reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/reject', async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('id', sql.Int, id)
      .input('reason', sql.NVarChar, reason)
      .query('UPDATE requests SET status = \'Rejected\', rejection_reason = @reason WHERE id = @id');
    res.json({ message: 'Request rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comments API
app.get('/api/requests/:id/comments', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM request_comments WHERE request_id = @id ORDER BY created_at ASC');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { user_name, user_role, comment } = req.body;
  try {
    const pool = await sql.connect({ ...config, database: 'srms_db' });
    await pool.request()
      .input('request_id', sql.Int, id)
      .input('user_name', sql.NVarChar, user_name)
      .input('user_role', sql.NVarChar, user_role)
      .input('comment', sql.NVarChar, comment)
      .query(`
        INSERT INTO request_comments (request_id, user_name, user_role, comment)
        VALUES (@request_id, @user_name, @user_role, @comment)
      `);
    res.json({ message: 'Comment added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend (MSSQL) listening at http://localhost:${port}`);
});
