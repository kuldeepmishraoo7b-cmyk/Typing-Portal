import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import "dotenv/config";


import express, { json } from "express";
import { createConnection } from "mysql2";
import cors from "cors";
import bcrypt from "bcryptjs";
const { compare, hash } = bcrypt;

import forgotPasswordRoutes from "./routes/forgotPassword.js";
import adminForgotPasswordRoutes from "./routes/adminForgotPassword.js";

console.log("Current directory:", process.cwd());
console.log("DB Name:", process.env.DB_NAME);

const app = express();
app.use(cors());
app.use(json({ limit: "10mb" }));

const db = createConnection({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "typing website"
});

db.connect(err => {
  if (err) console.log("Database Error:", err);
  else     console.log("MySQL Connected");
});

app.use("/api/forgot-password",       forgotPasswordRoutes(db));
app.use("/api/admin-forgot-password", adminForgotPasswordRoutes(db));


function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) return 999;
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) sum += Math.pow(desc1[i] - desc2[i], 2);
  return Math.sqrt(sum);
}

function safeNum(val, fallback = 0) {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

function wordCount(paragraph) {
  if (!paragraph || typeof paragraph !== "string") return 0;
  return paragraph.trim().split(/\s+/).filter(Boolean).length;
}

function normaliseTotalWords(row) {
  if (row.total_words && row.total_words > 0) return row;
  if (row.typed_words > 0 && row.accuracy > 0) {
    row.total_words = Math.round(row.typed_words * 100.0 / row.accuracy);
  } else {
    row.total_words = row.total_words || 0;
  }
  return row;
}

const TOTAL_WORDS_COALESCE = `
  COALESCE(
    CASE
      WHEN e.paragraph IS NOT NULL AND TRIM(e.paragraph) != ''
      THEN (LENGTH(TRIM(e.paragraph)) - LENGTH(REPLACE(TRIM(e.paragraph), ' ', '')) + 1)
      ELSE NULL
    END,
    NULLIF(er.total_words, 0),
    CASE
      WHEN er.typed_words > 0 AND er.accuracy > 0
      THEN ROUND(er.typed_words * 100.0 / er.accuracy)
      ELSE 0
    END
  )
`;


app.post("/admin-login", async (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM boss WHERE username=?", [username], async (err, result) => {
    if (err) return res.json({ success: false, message: "Database error" });

    if (result.length > 0) {
      const admin = result[0];
      const match = await compare(password, admin.password);
      if (!match) return res.json({ success: false, message: "Invalid password" });
      return res.json({ success: true, role: "boss" });
    }

    db.query("SELECT * FROM admins WHERE username=?", [username], async (err2, result2) => {
      if (err2) return res.json({ success: false, message: "Database error" });
      if (result2.length === 0) return res.json({ success: false, message: "User not found" });

      const admin = result2[0];
      const match = await compare(password, admin.password);
      if (!match) return res.json({ success: false, message: "Invalid password" });

      return res.json({ success: true, role: "admin" });
    });
  });
});

app.post("/api/add-admin", async (req, res) => {
  const { username, password, createdBy } = req.body;

  if (createdBy !== "boss") {
    return res.status(403).json({ message: "Only super admin can add admin" });
  }
  if (!username || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query("SELECT id FROM admins WHERE username=?", [username], async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (result.length > 0) return res.status(400).json({ message: "Username already exists" });

    const hashedPassword = await hash(password, 10);
    db.query(
      "INSERT INTO admins (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err) => {
        if (err) return res.status(500).json({ message: "Error adding admin" });
        res.json({ success: true, message: "Admin added successfully" });
      }
    );
  });
});

app.get("/api/get-admins", (req, res) => {
  db.query(
    "SELECT id, username, created_at FROM admins ORDER BY created_at DESC",
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error fetching admins" });
      res.json(result);
    }
  );
});

app.delete("/api/delete-admin/:id", (req, res) => {
  db.query("DELETE FROM admins WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true, message: "Admin deleted successfully" });
  });
});


app.get("/students", (req, res) => {
  db.query(
    "SELECT id, username, phone, photo AS image FROM students",
    (err, result) => {
      if (err) return res.status(500).json({ error: "Error fetching students" });
      res.json(result);
    }
  );
});

app.delete("/delete-student/:id", (req, res) => {
  db.query("DELETE FROM students WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

app.put("/update-student/:id", (req, res) => {
  const { username, phone } = req.body;
  db.query(
    "UPDATE students SET username=?, phone=? WHERE id=?",
    [username, phone, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Update failed" });
      res.json({ success: true });
    }
  );
});


app.post("/register-student", async (req, res) => {
  try {
    const { username, phone, email, password, photo, descriptor } = req.body;

    if (!username || !phone || !email || !password || !photo || !descriptor) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (!Array.isArray(descriptor) || descriptor.length === 0) {
      return res.status(400).json({ message: "Invalid face descriptor" });
    }

    db.query("SELECT id FROM students WHERE email=?", [email], (errEmail, emailResult) => {
      if (errEmail) return res.status(500).json({ message: "Database error" });

      if (emailResult.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      db.query("SELECT id, descriptor FROM students", async (err, users) => {
        if (err) return res.status(500).json({ message: "Database error checking faces" });

        for (let user of users) {
          if (user.descriptor) {
            try {
              const existing = JSON.parse(user.descriptor);
              if (euclideanDistance(descriptor, existing) < 0.5) {
                return res.status(409).json({
                  message: "Face already registered. Only one account allowed per person."
                });
              }
            } catch { continue; }
          }
        }

        db.query("SELECT id FROM students WHERE username=?", [username], async (err, existing) => {
          if (err) return res.status(500).json({ message: "Database error" });

          if (existing.length > 0) {
            return res.status(409).json({ message: "Username already taken." });
          }

          try {
            const hashedPassword = await hash(password, 10);

            db.query(
              "INSERT INTO students (username, phone, email, password, photo, descriptor) VALUES (?, ?, ?, ?, ?, ?)",
              [username, phone, email, hashedPassword, photo, JSON.stringify(descriptor)],
              (err) => {
                if (err) {
                  console.error(err);
                  return res.status(500).json({ message: "Database error during registration" });
                }

                res.json({
                  success: true,
                  message: "Student registered successfully"
                });
              }
            );

          } catch {
            return res.status(500).json({ message: "Server error during registration" });
          }
        });
      });
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/student-login", async (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM students WHERE username=?", [username], async (err, result) => {
    if (err)            return res.json({ success: false, message: "Database error" });
    if (!result.length) return res.json({ success: false, message: "Invalid username or password" });

    const student = result[0];
    const match   = await compare(password, student.password);
    if (!match)         return res.json({ success: false, message: "Invalid username or password" });

    if (student.descriptor && typeof student.descriptor === "string") {
      try { student.descriptor = JSON.parse(student.descriptor); }
      catch { student.descriptor = null; }
    }

    const studentSafe = {
      id:         student.id,
      username:   student.username,
      phone:      student.phone,
      photo:      student.photo,
      descriptor: student.descriptor
    };

    db.query(
      "INSERT INTO login_activity (student_id, username, login_time, language, score, level_reached, wpm, accuracy) VALUES (?, ?, NOW(), '', 0, 0, 0, 0)",
      [student.id, student.username],
      (err, logResult) => {
        if (err) return res.json({ success: false, message: "Login logging failed" });
        res.json({ success: true, student: studentSafe, login_id: logResult.insertId });
      }
    );
  });
});


app.post("/save-practice", (req, res) => {
  const { login_id, language, score, level_reached, wpm, accuracy } = req.body;
  db.query(
    "UPDATE login_activity SET language=?, score=?, level_reached=?, wpm=?, accuracy=? WHERE id=?",
    [language, safeNum(score), safeNum(level_reached), safeNum(wpm), safeNum(accuracy), login_id],
    (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    }
  );
});


app.post("/student-login-activity", (req, res) => {
  const { student_id, username, language } = req.body;
  if (!student_id || !username) return res.status(400).json({ message: "Missing fields" });

  const sql = `
    INSERT INTO login_activity
      (student_id, username, login_time, language, score, level_reached, wpm, accuracy)
    VALUES (?, ?, NOW(), ?, 0, 0, 0, 0)
  `;
  db.query(sql, [student_id, username, language || ""], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to create activity row" });
    res.json({ success: true, login_id: result.insertId });
  });
});


app.post("/api/live-practice", (req, res) => {
  const { login_id, language, score, level_reached, wpm, accuracy } = req.body;
  if (!login_id) return res.status(400).json({ message: "login_id required" });

  db.query(
    "UPDATE login_activity SET language=?, score=?, level_reached=?, wpm=?, accuracy=? WHERE id=?",
    [language || "", safeNum(score), safeNum(level_reached), safeNum(wpm), safeNum(accuracy), login_id],
    (err) => {
      if (err) return res.status(500).json({ message: "Live update failed" });
      res.json({ success: true });
    }
  );
});


app.get("/practice-text", (req, res) => {
  const { language, level } = req.query;
  db.query(
    "SELECT * FROM practice_text WHERE language=? AND level=? ORDER BY RAND() LIMIT 1",
    [language, level],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send(result);
    }
  );
});


app.get("/admin/login_activity", (req, res) => {
  db.query(
    "SELECT id, student_id, username, login_time, language, score, level_reached, wpm, accuracy FROM login_activity ORDER BY login_time DESC",
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

app.delete("/delete-activity/:id", (req, res) => {
  db.query("DELETE FROM login_activity WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});


app.get("/get-exams", (req, res) => {
  const query = `
    SELECT *,
      DATE_FORMAT(exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(exam_date, ' ', start_time) AS start_datetime
    FROM exams
    WHERE CONCAT(exam_date, ' ', start_time) <= NOW()
      AND DATE_ADD(CONCAT(exam_date, ' ', start_time), INTERVAL duration MINUTE) >= NOW()
    ORDER BY exam_date, start_time
  `;
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/get-exam/:id", (req, res) => {
  const query = `
    SELECT *,
      DATE_FORMAT(exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(exam_date, ' ', start_time) AS start_datetime
    FROM exams
    WHERE id=?
      AND CONCAT(exam_date, ' ', start_time) <= NOW()
      AND DATE_ADD(CONCAT(exam_date, ' ', start_time), INTERVAL duration MINUTE) >= NOW()
  `;
  db.query(query, [req.params.id], (err, results) => {
    if (err)             return res.status(500).json({ error: err.message });
    if (!results.length) return res.status(403).json({ error: "Exam not active!" });
    res.json(results[0]);
  });
});


app.post("/api/create-exam", (req, res) => {
  const { language, paragraph, examDate, startTime, duration, assignToAll, studentIds } = req.body;

  if (!language || !paragraph || !examDate || !startTime || !duration)
    return res.status(400).json({ message: "All fields required" });

  const isAssignToAll = assignToAll ? 1 : 0;

  db.query(
    "INSERT INTO exams (language, paragraph, exam_date, start_time, duration, assign_to_all) VALUES (?, ?, ?, ?, ?, ?)",
    [language, paragraph, examDate, startTime, duration, isAssignToAll],
    (err, result) => {
      if (err) {
        if (err.code === "ER_BAD_FIELD_ERROR") {
          db.query(
            "INSERT INTO exams (language, paragraph, exam_date, start_time, duration) VALUES (?, ?, ?, ?, ?)",
            [language, paragraph, examDate, startTime, duration],
            (fbErr, fbResult) => {
              if (fbErr) return res.status(500).json({ message: "Error creating exam" });
              assignStudents(fbResult.insertId, assignToAll, studentIds, res, "Exam created successfully");
            }
          );
          return;
        }
        return res.status(500).json({ message: "Error creating exam" });
      }
      assignStudents(result.insertId, assignToAll, studentIds, res, "Exam created successfully");
    }
  );
});

function assignStudents(examId, assignToAll, studentIds, res, successMsg) {
  if (!assignToAll && studentIds && studentIds.length > 0) {
    const values = studentIds.map(sid => [examId, sid]);
    db.query("INSERT INTO exam_assignments (exam_id, student_id) VALUES ?", [values], (err) => {
      if (err) return res.status(500).json({ message: "Exam created but assignment failed" });
      res.json({ message: successMsg + " and assigned" });
    });
  } else {
    res.json({ message: successMsg + " (assigned to all)" });
  }
}


app.get("/api/all-exams", (req, res) => {
  const sql = `
    SELECT
      e.*,
      DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(e.exam_date, ' ', e.start_time) AS start_datetime,
      GROUP_CONCAT(s.username ORDER BY s.username SEPARATOR ', ') AS assigned_students
    FROM exams e
    LEFT JOIN exam_assignments ea ON e.id = ea.exam_id
    LEFT JOIN students s ON ea.student_id = s.id
    GROUP BY e.id
    ORDER BY e.exam_date DESC, e.start_time DESC
  `;
  db.query(sql, (err, result) => {
    if (err) {
      db.query(
        "SELECT *, CONCAT(exam_date, ' ', start_time) AS start_datetime FROM exams ORDER BY exam_date DESC, start_time DESC",
        (fbErr, fbResult) => {
          if (fbErr) return res.status(500).json([]);
          res.json(fbResult);
        }
      );
      return;
    }
    res.json(result);
  });
});


app.delete("/api/exam/:id", (req, res) => {
  const examId = req.params.id;

  db.query("DELETE FROM exam_assignments WHERE exam_id=?", [examId], (err) => {
    if (err) return res.status(500).json({ message: "Failed to remove exam assignments" });

    db.query("DELETE FROM exams WHERE id=?", [examId], (err2) => {
      if (err2) return res.status(500).json({ message: "Failed to delete exam" });
      res.json({ message: "Exam deleted." });
    });
  });
});


app.get("/api/exams-for-student/:studentId", (req, res) => {
  const studentId = req.params.studentId;

  const sql = `
    SELECT
      e.*,
      DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
      CONCAT(e.exam_date, ' ', e.start_time) AS start_datetime,
      (SELECT COUNT(*) FROM exam_results er
       WHERE er.student_id=? AND er.exam_id=e.id) AS attempted,
      CASE
        WHEN NOW() < CONCAT(e.exam_date, ' ', e.start_time) THEN 'Not Started'
        WHEN NOW() > DATE_ADD(CONCAT(e.exam_date, ' ', e.start_time), INTERVAL e.duration MINUTE) THEN 'Expired'
        ELSE 'Ongoing'
      END AS status
    FROM exams e
    WHERE (
      e.assign_to_all = 1
      OR EXISTS (
        SELECT 1 FROM exam_assignments ea
        WHERE ea.exam_id = e.id AND ea.student_id = ?
      )
    )
    ORDER BY e.exam_date ASC, e.start_time ASC
  `;

  db.query(sql, [studentId, studentId], (err, result) => {
    if (err) {
      const fallbackSql = `
        SELECT e.*,
          DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
          CONCAT(e.exam_date, ' ', e.start_time) AS start_datetime,
          (SELECT COUNT(*) FROM exam_results er WHERE er.student_id=? AND er.exam_id=e.id) AS attempted,
          CASE
            WHEN NOW() < CONCAT(e.exam_date, ' ', e.start_time) THEN 'Not Started'
            WHEN NOW() > DATE_ADD(CONCAT(e.exam_date, ' ', e.start_time), INTERVAL e.duration MINUTE) THEN 'Expired'
            ELSE 'Ongoing'
          END AS status
        FROM exams e
        ORDER BY e.exam_date ASC, e.start_time ASC
      `;
      db.query(fallbackSql, [studentId], (fbErr, fbResult) => {
        if (fbErr) return res.status(500).json([]);
        res.json(fbResult.filter(e => e.status !== "Expired"));
      });
      return;
    }
    res.json(result.filter(e => e.status !== "Expired"));
  });
});


app.post("/save-exam-result", (req, res) => {
  const {
    student_id, username, language, exam_id,
    typed_words, errors, points, wpm, accuracy,
    warnings, status, wrong_person, integrity_note,
    eye_warnings, multi_face, suspicious_events, suspicious_log,
    gross_wpm, total_possible_points, total_characters, duration_used
  } = req.body;

  console.log("=== SAVE EXAM RESULT CALLED ===");
  console.log("student_id:", student_id, "exam_id:", exam_id);

  if (!student_id || !exam_id)
    return res.status(400).json({ message: "Missing required fields: student_id or exam_id" });

  const safePoints        = safeNum(points);
  const safeWpm           = safeNum(wpm);
  const safeAccuracy      = safeNum(accuracy);
  const safeErrors        = safeNum(errors);
  const safeWarnings      = safeNum(warnings);
  const safeTyped         = safeNum(typed_words);
  const safeEyeWarnings   = safeNum(eye_warnings);
  const safeGrossWpm      = safeNum(gross_wpm);
  const safeTotalPossible = safeNum(total_possible_points);
  const safeTotalChars    = safeNum(total_characters);
  const safeDurationUsed  = safeNum(duration_used);

  db.query(
    "SELECT id FROM exam_results WHERE student_id=? AND exam_id=?",
    [student_id, exam_id],
    (err, existing) => {
      if (err) {
        console.error("Duplicate check error:", err);
        return res.status(500).json({ message: "Database error checking existing result: " + err.message });
      }
      if (existing.length > 0) {
        return res.status(400).json({ message: "Exam already submitted" });
      }

      db.query("SELECT paragraph, exam_date FROM exams WHERE id=?", [exam_id], (examErr, examRows) => {
        let totWords = 0;
        if (!examErr && examRows && examRows.length && examRows[0].paragraph) {
          totWords = wordCount(examRows[0].paragraph);
        } else if (safeTyped > 0 && safeAccuracy > 0) {
          totWords = Math.round(safeTyped * 100.0 / safeAccuracy);
        }

        db.query("SHOW COLUMNS FROM exam_results", (colErr, columns) => {
          if (colErr) {
            console.error("SHOW COLUMNS error:", colErr);
            return res.status(500).json({ message: "Cannot read table schema: " + colErr.message });
          }

          const colNames = columns.map(c => c.Field);
          console.log("exam_results columns:", colNames);

          const fields = [];
          const values = [];

          const add = (col, val) => {
            if (colNames.includes(col)) {
              fields.push(col);
              values.push(val);
            }
          };

          add("student_id",            student_id);
          add("username",              username || "");
          add("language",              language || "");
          add("exam_id",               exam_id);
          add("typed_words",           safeTyped);
          add("total_characters",      safeTotalChars);
          add("errors",                safeErrors);
          add("points",                safePoints);
          add("total_possible_points", safeTotalPossible);
          add("wpm",                   safeWpm);
          add("gross_wpm",             safeGrossWpm);
          add("accuracy",              safeAccuracy);
          add("warnings",              safeWarnings);
          add("status",                status || "completed");
          add("is_published",          0);
          add("total_words",           totWords);
          if (safeDurationUsed > 0) add("duration", safeDurationUsed);

          if (colNames.includes("submitted_at")) {
            fields.push("submitted_at");
            values.push(new Date());
          }

          const integrityNote = integrity_note ||
            (wrong_person ? "⚠️ Wrong person detected during exam" :
             multi_face   ? "⚠️ Multiple faces detected during exam" :
             "✅ Identity verified throughout exam");

          add("wrong_person",       wrong_person ? 1 : 0);
          add("integrity_note",     integrityNote);
          add("eye_warnings",       safeEyeWarnings);
          add("multi_face",         multi_face ? 1 : 0);
          add("suspicious_events",  safeNum(suspicious_events));

          if (colNames.includes("suspicious_log")) {
            fields.push("suspicious_log");
            try {
              values.push(Array.isArray(suspicious_log)
                ? JSON.stringify(suspicious_log)
                : (suspicious_log || "[]"));
            } catch { values.push("[]"); }
          }

          if (colNames.includes("cheat_reason")) {
            fields.push("cheat_reason");
            values.push(wrong_person ? "Wrong person detected during exam" : null);
          }

          if (colNames.includes("exam_date")) {
            fields.push("exam_date");
            const examDate = (examRows && examRows[0] && examRows[0].exam_date)
              ? examRows[0].exam_date
              : new Date();
            values.push(examDate);
          }

          const placeholders = fields.map(() => "?").join(", ");
          const sql = `INSERT INTO exam_results (${fields.join(", ")}) VALUES (${placeholders})`;

          console.log("INSERT SQL:", sql);
          console.log("INSERT VALUES:", values);

          db.query(sql, values, (insertErr) => {
            if (insertErr) {
              console.error("INSERT exam_results FAILED:", insertErr);
              console.error("SQL was:", sql);
              console.error("Values were:", values);
              return res.status(500).json({
                message: "Failed to save exam result",
                error: insertErr.message,
                sqlCode: insertErr.code
              });
            }
            console.log("Exam submitted successfully for student:", student_id, "exam:", exam_id);
            res.json({ message: "Exam submitted successfully", points: safePoints });
          });
        });
      });
    }
  );
});


app.get("/api/student-results/:studentId", (req, res) => {
  const studentId = req.params.studentId;

  const sql = `
    SELECT
      er.id,
      er.student_id,
      er.exam_id,
      er.language,
      er.status,
      er.is_published,
      er.submitted_at,
      er.wpm,
      er.gross_wpm,
      er.accuracy,
      er.points,
      er.total_possible_points,
      er.typed_words,
      er.total_characters,
      er.errors,
      er.warnings,
      er.eye_warnings,
      er.wrong_person,
      er.multi_face,
      er.suspicious_events,
      er.integrity_note,
      er.exam_date,
      ${TOTAL_WORDS_COALESCE} AS total_words
    FROM exam_results er
    LEFT JOIN exams e ON er.exam_id = e.id
    WHERE er.student_id = ?
      AND er.is_published = 1
    ORDER BY er.submitted_at DESC
  `;

  db.query(sql, [studentId], (err, rows) => {
    if (err) {
      db.query(
        `SELECT * FROM exam_results
         WHERE student_id = ? AND is_published = 1
         ORDER BY submitted_at DESC`,
        [studentId],
        (fbErr, fbResult) => {
          if (fbErr) return res.status(500).json([]);
          res.json(fbResult.map(r => normaliseTotalWords(r)));
        }
      );
      return;
    }
    res.json(rows);
  });
});


app.delete("/api/delete-result/:id", (req, res) => {
  db.query("DELETE FROM exam_results WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});


app.get("/api/exam-results", (req, res) => {
  const sql = `
    SELECT
      er.id,
      er.student_id,
      er.exam_id,
      er.language,
      er.status,
      er.is_published,
      er.submitted_at,
      er.wpm,
      er.gross_wpm,
      er.accuracy,
      er.points,
      er.total_possible_points,
      er.typed_words,
      er.total_characters,
      er.errors,
      er.warnings,
      er.eye_warnings,
      er.wrong_person,
      er.multi_face,
      er.suspicious_events,
      er.integrity_note,
      er.exam_date,
      s.username,
      ${TOTAL_WORDS_COALESCE} AS total_words,
      ROUND(
        er.typed_words / NULLIF(${TOTAL_WORDS_COALESCE}, 0) * 100
      ) AS typed_pct
    FROM exam_results er
    JOIN students s ON er.student_id = s.id
    LEFT JOIN exams e ON er.exam_id = e.id
    ORDER BY er.submitted_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      db.query(
        `SELECT er.*, s.username FROM exam_results er
         JOIN students s ON er.student_id = s.id
         ORDER BY er.submitted_at DESC`,
        (fbErr, fbResult) => {
          if (fbErr) return res.status(500).json([]);
          res.json(fbResult.map(r => normaliseTotalWords(r)));
        }
      );
      return;
    }
    res.json(result);
  });
});


app.put("/api/publish-result/:id", (req, res) => {
  db.query("UPDATE exam_results SET is_published=1 WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to publish result" });
    res.json({ message: "Result published successfully" });
  });
});

app.put("/api/revoke-result/:id", (req, res) => {
  db.query("UPDATE exam_results SET is_published=0 WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to revoke result" });
    res.json({ message: "Result revoked successfully" });
  });
});


app.post("/api/send-message", (req, res) => {
  const { student_id, student_name, student_photo, message } = req.body;
  db.query(
    "INSERT INTO messages (student_id, student_name, student_photo, message) VALUES (?, ?, ?, ?)",
    [student_id, student_name, student_photo, message],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send({ success: true });
    }
  );
});

app.get("/api/messages", (req, res) => {
  db.query("SELECT * FROM messages ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

app.post("/api/reply-message", (req, res) => {
  const { id, reply, status } = req.body;
  db.query("UPDATE messages SET reply=?, status=? WHERE id=?", [reply, status, id], (err) => {
    if (err) return res.status(500).send(err);
    res.send({ success: true });
  });
});

app.post("/api/update-status", (req, res) => {
  const { id, status } = req.body;
  if (!id || !status) return res.status(400).json({ message: "id and status required" });
  db.query("UPDATE messages SET status=? WHERE id=?", [status, id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to update status" });
    res.json({ success: true });
  });
});

app.delete("/api/delete-message/:id", (req, res) => {
  db.query("DELETE FROM messages WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete failed" });
    res.json({ success: true });
  });
});

app.get("/api/student-messages/:id", (req, res) => {
  db.query(
    "SELECT * FROM messages WHERE student_id=? ORDER BY id DESC",
    [req.params.id],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send(result);
    }
  );
});


app.get("/verify-session/:id", (req, res) => {
  db.query(
    "SELECT id FROM students WHERE id = ?",
    [req.params.id],
    (err, result) => {
      if (err) return res.json({ valid: false });
      res.json({ valid: result.length > 0 });
    }
  );
});



// ===============================
// Serve React Student Build
// ===============================

//app.use(express.static(path.join(__dirname, "../Student/dist")));

//app.get("*", (req, res) => {
  //res.sendFile(path.join(__dirname, "../Student/dist/index.html"));
//});




app.listen(5000, () => console.log("✅ Server running on port 5000"));
