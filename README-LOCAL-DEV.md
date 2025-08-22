# Local WordPress Development Setup

## Option 1: Docker (Recommended)

1. **Start WordPress:**
   ```bash
   docker-compose up -d
   ```

2. **Access WordPress:**
   - Frontend: http://localhost:8080
   - Admin: http://localhost:8080/wp-admin

3. **WordPress Setup:**
   - Choose language, create admin user
   - Login and go to Plugins → Installed Plugins
   - Activate "Class Schedule"

4. **Test the Plugin:**
   - Admin: Go to "Class Schedule" in the admin menu
   - Add some test classes
   - Frontend: Create a page and add `[class_schedule]` shortcode

5. **Stop when done:**
   ```bash
   docker-compose down
   ```

## Plugin Testing Checklist

### Admin Functionality:
- [ ] Plugin activates without errors
- [ ] "Class Schedule" appears in admin menu
- [ ] Can add new classes via the form
- [ ] Classes appear in the day columns
- [ ] Edit/Delete buttons work
- [ ] Changes persist after page refresh

### Frontend Display:
- [ ] Create a page with `[class_schedule]` shortcode
- [ ] Schedule grid displays with 7 columns (Mon-Sun)
- [ ] Classes appear in correct day columns
- [ ] Responsive layout works on mobile
- [ ] Styling matches the design

### Gutenberg Block:
- [ ] "Class Schedule" block appears in inserter
- [ ] Block can be inserted into posts/pages
- [ ] Block renders schedule on frontend

### REST API:
- [ ] GET `/wp-json/class-schedule/v1/schedule` returns JSON
- [ ] Admin can POST updates to the endpoint
- [ ] Data persists in database

## Common Issues:

**Plugin won't activate:** Check error logs, ensure PHP 7.4+
**Admin page blank:** Check browser console for JS errors
**Shortcode not rendering:** Ensure plugin is active, check for theme conflicts
**Styles not loading:** Check file permissions, clear cache

## File Structure:
```
wp-content/plugins/class-schedule/
├── class-schedule.php      # Main plugin file
├── uninstall.php          # Cleanup on uninstall
├── build/                 # Compiled assets
│   ├── admin.js          # Admin UI (vanilla JS)
│   ├── admin.css         # Admin styles
│   ├── public.js         # Frontend renderer
│   ├── public.css        # Frontend styles
│   ├── block.js          # Gutenberg block
│   └── block.css         # Block editor styles
└── src/                  # Source files (for future React build)
```
