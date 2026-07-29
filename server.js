/**
 * Sen Trắng Hub — Local Full-Stack Node.js Server & Supabase Proxy
 * Port: 3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'frontend');

// Supabase Credentials (Read from environment variables)
const SUPABASE_URL = process.env.SUPABASE_URL || "https://fjshckqpfkjsbpfkojhm.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API Endpoints Handler
  if (req.url.startsWith('/api/')) {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const parsedBody = body ? JSON.parse(body) : {};

        // 1. Auth Login
        if (req.url === '/api/auth/login' && req.method === 'POST') {
          const { email, password } = parsedBody;

          // Local demo login fallback (when Supabase is not configured)
          if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === '') {
            // Demo credentials check
            if (email === 'admin@sentranghub.vn' && password === 'SenTrang@2026!') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                access_token: 'demo_token_' + Date.now(),
                refresh_token: 'demo_refresh_' + Date.now(),
                expires_in: 86400,
                user: {
                  id: 'admin_uid',
                  email: 'admin@sentranghub.vn',
                  display_name: 'Admin Hệ Thống',
                  role_id: 'role_super_admin',
                  role_name: 'Super Admin',
                  role_level: 0,
                  is_active: true,
                  permissions: ['users.read', 'users.create', 'users.update', 'roles.manage', 'events.create', 'articles.create', 'quizzes.create', 'quizzes.take'],
                  created_at: new Date()
                }
              }));
              return;
            } else {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ detail: 'Email hoặc mật khẩu không chính xác. Hãy sử dụng tài khoản demo mặc định.' }));
              return;
            }
          }

          // Supabase auth (when configured)
          try {
            const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
              method: 'POST',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password })
            });

            const authData = await authRes.json();
            if (!authRes.ok) {
              res.writeHead(401, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ detail: authData.error_description || 'Đăng nhập thất bại' }));
              return;
            }

            const userId = authData.user.id;
            const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=*`, {
              headers: {
                'apikey': SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`
              }
            });
            const userDb = await userRes.json();
            const userData = (userDb && userDb[0]) || {
              id: userId,
              email: email,
              display_name: email.split('@')[0],
              role_id: 'role_super_admin',
              is_active: true
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              access_token: authData.access_token,
              refresh_token: authData.refresh_token,
              expires_in: authData.expires_in,
              user: {
                id: userData.id,
                email: userData.email,
                display_name: userData.display_name,
                role_id: userData.role_id || 'role_super_admin',
                role_name: 'Super Admin',
                role_level: 0,
                is_active: true,
                permissions: ['users.read', 'users.create', 'users.update', 'roles.manage', 'events.create', 'articles.create', 'quizzes.create', 'quizzes.take'],
                created_at: new Date()
              }
            }));
            return;
          } catch (authErr) {
            // If Supabase is unreachable, fall back to demo login
            if (email === 'admin@sentranghub.vn' && password === 'SenTrang@2026!') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                access_token: 'fallback_token_' + Date.now(),
                refresh_token: 'fallback_refresh_' + Date.now(),
                expires_in: 86400,
                user: {
                  id: 'admin_uid',
                  email: 'admin@sentranghub.vn',
                  display_name: 'Admin Hệ Thống',
                  role_id: 'role_super_admin',
                  role_name: 'Super Admin',
                  role_level: 0,
                  is_active: true,
                  permissions: ['users.read', 'users.create', 'users.update', 'roles.manage', 'events.create', 'articles.create', 'quizzes.create', 'quizzes.take'],
                  created_at: new Date()
                }
              }));
              return;
            }
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ detail: 'Không thể kết nối đến server xác thực.' }));
            return;
          }
        }

        // 2. Auth Register
        if (req.url === '/api/auth/register' && req.method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: 'new_user_id',
            email: parsedBody.email,
            display_name: parsedBody.display_name,
            role_id: 'role_thanh_vien',
            is_active: true
          }));
          return;
        }

        // 3. Get Users
        if (req.url.startsWith('/api/users') && req.method === 'GET') {
          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
            headers: {
              'apikey': SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY}`
            }
          });
          let users = await dbRes.json();
          if (!Array.isArray(users) || users.length === 0) {
            users = [
              {
                id: 'admin_uid',
                email: 'admin@sentranghub.vn',
                display_name: 'Admin Hệ Thống',
                role_id: 'role_super_admin',
                role_name: 'Super Admin',
                is_active: true,
                created_at: new Date().toISOString()
              },
              {
                id: 'user_001',
                email: 'an.nguyen@sentranghub.vn',
                display_name: 'Nguyễn Văn An',
                role_id: 'role_chu_nhiem',
                role_name: 'Chủ nhiệm',
                is_active: true,
                created_at: new Date().toISOString()
              },
              {
                id: 'user_002',
                email: 'binh.tran@sentranghub.vn',
                display_name: 'Trần Thị Bình',
                role_id: 'role_thanh_vien',
                role_name: 'Thành viên',
                is_active: true,
                created_at: new Date().toISOString()
              }
            ];
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(users));
          return;
        }

        // 4. Get Roles
        if (req.url.startsWith('/api/roles/permissions/all')) {
          const perms = [
            { id: 'users.create', module: 'users', action: 'create', description: 'Tạo tài khoản người dùng', group: 'Quản trị' },
            { id: 'users.read', module: 'users', action: 'read', description: 'Xem danh sách tài khoản', group: 'Quản trị' },
            { id: 'users.update', module: 'users', action: 'update', description: 'Cập nhật tài khoản', group: 'Quản trị' },
            { id: 'roles.manage', module: 'roles', action: 'manage', description: 'Quản lý vai trò & phân quyền', group: 'Quản trị' },
            { id: 'events.create', module: 'events', action: 'create', description: 'Tạo sự kiện mới', group: 'Hoạt động' },
            { id: 'attendance.manage', module: 'attendance', action: 'manage', description: 'Quản lý điểm danh', group: 'Hoạt động' },
            { id: 'articles.create', module: 'articles', action: 'create', description: 'Tạo bài viết mới', group: 'Truyền thông' },
            { id: 'articles.publish', module: 'articles', action: 'publish', description: 'Xuất bản bài viết', group: 'Truyền thông' },
            { id: 'quizzes.create', module: 'quizzes', action: 'create', description: 'Tạo bài thi trắc nghiệm', group: 'Đào tạo' },
            { id: 'quizzes.take', module: 'quizzes', action: 'take', description: 'Làm bài thi trắc nghiệm', group: 'Đào tạo' }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(perms));
          return;
        }

        if (req.url.startsWith('/api/roles')) {
          const roles = [
            { id: 'role_super_admin', name: 'Super Admin', description: 'Quản trị viên cao nhất, toàn quyền hệ thống', level: 0, permissions: ['users.create', 'users.read', 'roles.manage', 'events.create', 'articles.create', 'quizzes.create'] },
            { id: 'role_chu_nhiem', name: 'Chủ nhiệm', description: 'Chủ nhiệm câu lạc bộ', level: 1, permissions: ['users.read', 'events.create', 'articles.create', 'quizzes.create'] },
            { id: 'role_pho_chu_nhiem', name: 'Phó Chủ nhiệm', description: 'Phó Chủ nhiệm câu lạc bộ', level: 2, permissions: ['users.read', 'events.create', 'articles.create'] },
            { id: 'role_thu_quy', name: 'Thủ quỹ', description: 'Quản lý tài chính câu lạc bộ', level: 3, permissions: ['users.read'] },
            { id: 'role_truong_ban', name: 'Trưởng ban', description: 'Trưởng ban chuyên môn', level: 3, permissions: ['events.create', 'quizzes.create'] },
            { id: 'role_thanh_vien', name: 'Thành viên', description: 'Thành viên câu lạc bộ', level: 10, permissions: ['quizzes.take'] }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(roles));
          return;
        }

        // 5. Members
        if (req.url.match(/^\/api\/members\/[^/]+$/) && req.method === 'GET') {
          const memberId = req.url.split('/').pop();
          const memberDetail = {
            profile: {
              id: memberId,
              full_name: 'Nguyễn Văn An',
              email: 'an.nguyen@sentranghub.vn',
              student_id: '2026001',
              generation: 'Gen 12',
              department: 'Ban Phong trào',
              current_position: 'Chủ nhiệm',
              status: 'active',
              joined_at: '2024-09-01'
            },
            external_positions: [
              { position: 'Phó Bí thư Chi Đoàn', organization: 'Chi Đoàn Khoa CNTT - ĐH Bách Khoa' },
              { position: 'UV BCH Hội SV', organization: 'Hội Sinh viên Trường ĐH Bách Khoa TP.HCM' }
            ],
            position_history: [
              { role_id: 'Thành viên', start_date: '2024-09-01', end_date: '2025-03-01' },
              { role_id: 'Phó Chủ nhiệm', start_date: '2025-03-01', end_date: '2026-01-01' },
              { role_id: 'Chủ nhiệm', start_date: '2026-01-01', end_date: null }
            ]
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: memberDetail }));
          return;
        }

        if (req.url === '/api/members' && req.method === 'GET') {
          const members = [
            { id: 'mem_001', full_name: 'Nguyễn Văn An', email: 'an.nguyen@sentranghub.vn', student_id: '2026001', generation: 'Gen 12', department: 'Ban Phong trào', current_position: 'Chủ nhiệm', status: 'active' },
            { id: 'mem_002', full_name: 'Trần Thị Bình', email: 'binh.tran@sentranghub.vn', student_id: '2026002', generation: 'Gen 12', department: 'Ban Truyền thông', current_position: 'Phó Chủ nhiệm', status: 'active' },
            { id: 'mem_003', full_name: 'Lê Hoàng Cường', email: 'cuong.le@sentranghub.vn', student_id: '2026003', generation: 'Gen 11', department: 'Ban Chuyên môn', current_position: 'Trưởng ban', status: 'active' },
            { id: 'mem_004', full_name: 'Phạm Minh Đức', email: 'duc.pham@sentranghub.vn', student_id: '2026004', generation: 'Gen 12', department: 'Ban Phong trào', current_position: 'Thành viên', status: 'active' },
            { id: 'mem_005', full_name: 'Võ Thị Mai Hương', email: 'huong.vo@sentranghub.vn', student_id: '2026005', generation: 'Gen 11', department: 'Ban Chủ nhiệm', current_position: 'Thư ký', status: 'inactive' }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: members }));
          return;
        }

        if (req.url === '/api/members' && req.method === 'POST') {
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Tạo hồ sơ thành viên mới thành công!', data: { id: 'mem_new_' + Date.now(), ...parsedBody } }));
          return;
        }

        // 5b. Certificates & Leaderboard
        if (req.url === '/api/certificates/leaderboard' && req.method === 'GET') {
          const leaderboard = [
            { id: 'mem_001', rank: 1, full_name: 'Nguyễn Văn An', generation: 'Gen 12', department: 'Ban Phong trào', total_points: 285 },
            { id: 'mem_002', rank: 2, full_name: 'Trần Thị Bình', generation: 'Gen 12', department: 'Ban Truyền thông', total_points: 240 },
            { id: 'mem_003', rank: 3, full_name: 'Lê Hoàng Cường', generation: 'Gen 11', department: 'Ban Chuyên môn', total_points: 195 },
            { id: 'mem_004', rank: 4, full_name: 'Phạm Minh Đức', generation: 'Gen 12', department: 'Ban Phong trào', total_points: 150 },
            { id: 'mem_005', rank: 5, full_name: 'Võ Thị Mai Hương', generation: 'Gen 11', department: 'Ban Chủ nhiệm', total_points: 120 }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: leaderboard }));
          return;
        }

        if (req.url.match(/^\/api\/certificates\/[^/]+\/issue/) && req.method === 'GET') {
          const cert = {
            certificate_id: 'CERT-STH-2026-' + String(Math.floor(Math.random() * 9000) + 1000),
            title: 'GIẤY CHỨNG NHẬN THÀNH TÍCH XUẤT SẮC',
            recipient_name: 'Nguyễn Văn An',
            generation: 'Gen 12',
            department: 'Ban Phong trào',
            reason: 'Ghi nhận thành tích xuất sắc trong hoạt động tình nguyện vì cộng đồng, hoàn thành vượt mức chỉ tiêu điểm rèn luyện và đóng góp tích cực vào sự phát triển của CLB Thanh niên Tình nguyện Sen Trắng năm 2026.',
            total_points: 285,
            issued_date: new Date().toLocaleDateString('vi-VN'),
            issued_by: 'Ban Chủ nhiệm CLB Sen Trắng'
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ certificate: cert }));
          return;
        }

        // 6. Events
        if (req.url.startsWith('/api/events')) {
          if (req.url.includes('/attendance') && req.method === 'POST') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Điểm danh QR Code thành công! +10 Điểm rèn luyện.' }));
            return;
          }
          if (req.url.includes('/check-in')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Điểm danh QR Code thành công! +10 Điểm rèn luyện.' }));
            return;
          }
          const events = [
            {
              id: 'event_001',
              title: 'Chiến dịch Mùa hè xanh 2026',
              slug: 'chien-dich-mua-he-xanh-2026',
              description: 'Chiến dịch tình nguyện hè tại huyện Cần Giờ — xây dựng đường nông thôn, dạy học cho trẻ em.',
              category: 'volunteer',
              location: 'Huyện Cần Giờ, TP.HCM',
              start_date: new Date().toISOString(),
              max_participants: 50,
              current_count: 42,
              base_points: 10,
              status: 'active'
            },
            {
              id: 'event_002',
              title: 'Workshop Kỹ năng Thuyết trình',
              slug: 'workshop-ky-nang-thuyet-trinh',
              description: 'Workshop rèn luyện kỹ năng giao tiếp và thuyết trình trước đám đông cho tình nguyện viên.',
              category: 'training',
              location: 'Trường ĐH Bách Khoa TP.HCM',
              start_date: new Date().toISOString(),
              max_participants: 30,
              current_count: 18,
              base_points: 5,
              status: 'active'
            }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(events));
          return;
        }

        // 6. Articles CMS
        if (req.url.startsWith('/api/articles')) {
          if (req.url.includes('/publish')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Bài viết đã được xuất bản lên trang chủ!' }));
            return;
          }
          const articles = [
            {
              id: 'article_001',
              title: 'Sen Trắng — Hành trình 12 năm vì cộng đồng',
              slug: 'sen-trang-hanh-trinh-12-nam',
              excerpt: 'Nhìn lại chặng đường 12 năm hình thành và phát triển của CLB Tình nguyện Sen Trắng.',
              category: 'tin-tuc',
              status: 'published',
              view_count: 1250,
              created_at: new Date().toISOString()
            },
            {
              id: 'article_002',
              title: 'Thông báo: Tuyển thành viên Gen 15',
              slug: 'tuyen-thanh-vien-gen-15',
              excerpt: 'CLB Sen Trắng chính thức mở đợt tuyển thành viên Gen 15 cho nhiệm kỳ mới.',
              category: 'thong-bao',
              status: 'draft',
              view_count: 0,
              created_at: new Date().toISOString()
            }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(articles));
          return;
        }

        // 7. Quizzes
        if (req.url.startsWith('/api/quizzes')) {
          if (req.url.includes('/questions')) {
            const questions = [
              {
                id: 'q_001',
                question_text: 'Câu lạc bộ Sen Trắng được thành lập vào năm nào?',
                question_type: 'single_choice',
                options: [
                  { id: 'a', text: '2012' },
                  { id: 'b', text: '2014' },
                  { id: 'c', text: '2016' },
                  { id: 'd', text: '2018' }
                ]
              },
              {
                id: 'q_002',
                question_text: 'Những giá trị cốt lõi nào sau đây thuộc về CLB Sen Trắng?',
                question_type: 'single_choice',
                options: [
                  { id: 'a', text: 'Tận tâm, Sáng tạo, Đoàn kết' },
                  { id: 'b', text: 'Cạnh tranh, Tiên phong, Tối ưu' },
                  { id: 'c', text: 'Kỷ luật, Nghiêm túc, Thách thức' }
                ]
              }
            ];
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(questions));
            return;
          }

          if (req.url.includes('/start')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              attempt_id: 'att_demo_001',
              quiz_id: 'quiz_001',
              duration: 300,
              started_at: new Date().toISOString()
            }));
            return;
          }

          if (req.url.includes('/submit')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              attempt_id: 'att_demo_001',
              total_points: 2,
              max_points: 2,
              score_percent: 100,
              correct_count: 2,
              incorrect_count: 0,
              passed: true,
              grade: 'A',
              message: 'Chúc mừng bạn đã ĐẠT điểm tối đa 100% (Xếp loại Grade A)!'
            }));
            return;
          }

          const quizzes = [
            {
              id: 'quiz_001',
              title: 'Kiểm tra kiến thức tình nguyện viên 2026',
              description: 'Bài kiểm tra đánh giá kiến thức cơ bản về lịch sử, quy chế và kỹ năng tình nguyện.',
              category: 'orientation',
              duration: 300,
              passing_score: 70
            }
          ];
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(quizzes));
          return;
        }

        // Generic API Response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok' }));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ detail: err.message }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(PUBLIC_DIR, 'index.html'), (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🌸 Sen Trắng Hub (Full Server + API) đang chạy tại: http://localhost:${PORT}`);
});
