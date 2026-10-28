const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Replace various error states
  content = content.replace(
    /<div style={{[^}]*background:\s*'(?:rgba\(239,\s*68,\s*68,\s*0\.1\)|var\(--danger-glow\))'[^}]*}}>\s*\{error\}\s*<\/div>/g,
    '<div className="error-state">{error}</div>'
  );
  content = content.replace(
    /<div className="card" style={{ padding: '1rem', background: 'rgba\(239, 68, 68, 0\.05\)', borderColor: 'var\(--danger-glow\)', display: 'flex', gap: '0\.75rem', alignItems: 'center', marginBottom: '2rem' }}>/g,
    '<div className="error-state" style={{ marginBottom: "2rem" }}>'
  );
  content = content.replace(
    /<div style={{\s*marginTop:\s*'1rem',\s*padding:\s*'0\.75rem',\s*background:\s*'rgba\(239,\s*68,\s*68,\s*0\.1\)',\s*border:\s*'1px solid var\(--danger\)',\s*color:\s*'var\(--danger\)',\s*borderRadius:\s*'var\(--radius-sm\)',\s*fontSize:\s*'0\.85rem'\s*}}>/g,
    '<div className="error-state">'
  );

  // Replace Alerts with borderLeft
  // Primary
  content = content.replace(
    /<div style={{[^}]*borderLeft:\s*'(?:3px|4px) solid (?:var\(--primary\)|#a855f7)'[^}]*}}>/g,
    '<div className="alert alert-primary">'
  );
  // Secondary / Cyan
  content = content.replace(
    /<div style={{[^}]*borderLeft:\s*'(?:3px|4px) solid (?:var\(--secondary\)|#06b6d4)'[^}]*}}>/g,
    '<div className="alert alert-info">'
  );
  // Warning
  content = content.replace(
    /<div style={{[^}]*borderLeft:\s*'(?:3px|4px) solid (?:var\(--warning\)|var\(--accent\))'[^}]*}}>/g,
    '<div className="alert alert-warning">'
  );
  // Danger
  content = content.replace(
    /<div style={{[^}]*borderLeft:\s*'(?:3px|4px) solid (?:var\(--danger\)|#ef4444)'[^}]*}}>/g,
    '<div className="alert alert-danger">'
  );
  // Success
  content = content.replace(
    /<div style={{[^}]*borderLeft:\s*'(?:3px|4px) solid (?:var\(--success\)|#10b981)'[^}]*}}>/g,
    '<div className="alert alert-success">'
  );

  // Empty States (basic matching for the flex center pattern with dashed borders)
  content = content.replace(
    /<div style={{\s*flex:\s*1,\s*display:\s*'flex',\s*flexDirection:\s*'column',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*textAlign:\s*'center',[^}]*}}>/g,
    '<div className="empty-state" style={{ flex: 1 }}>'
  );
  content = content.replace(
    /<FileCheck size=\{48\} style={{ opacity: 0\.15, marginBottom: '1rem' }} \/>/g,
    '<FileCheck size={48} className="empty-state-icon" />'
  );
  
  // Login/Register Error States
  content = content.replace(
    /<div style={{\s*background:\s*'rgba\(239, 68, 68, 0\.1\)',\s*color:\s*'var\(--danger\)',\s*padding:\s*'0\.75rem',\s*borderRadius:\s*'var\(--radius-sm\)',\s*fontSize:\s*'0\.9rem',\s*marginBottom:\s*'1\.5rem',\s*display:\s*'flex',\s*alignItems:\s*'center',\s*gap:\s*'0\.5rem'\s*}}>/g,
    '<div className="error-state" style={{ marginBottom: "1.5rem" }}>'
  );

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated ' + file);
  }
});
