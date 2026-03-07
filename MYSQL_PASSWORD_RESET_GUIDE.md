# MySQL Password Reset Guide

You're getting: `ERROR 1045 (28000): Access denied for user 'root'@'localhost'`

This means MySQL requires a password but you don't know what it is.

## Solution: Complete Fresh Install

The cleanest solution is to completely remove and reinstall MySQL:

```bash
# 1. Stop MySQL
brew services stop mysql

# 2. Completely uninstall MySQL
brew uninstall mysql
brew uninstall mysql@8.0
brew uninstall mysql@8.4

# 3. Remove all MySQL data (BACKUP FIRST if you have important data!)
sudo rm -rf /opt/homebrew/var/mysql
sudo rm -rf /usr/local/var/mysql
sudo rm -rf ~/Library/LaunchAgents/homebrew.mxcl.mysql.plist
sudo rm -rf ~/Library/Preferences/com.mysql.*

# 4. Clean up
brew cleanup

# 5. Reinstall MySQL
brew install mysql

# 6. Start MySQL
brew services start mysql

# 7. Connect (no password needed on fresh install)
mysql -u root

# 8. Set a password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'pylott123';
exit;

# 9. Test the password
mysql -u root -p'pylott123'

# 10. Create the database
CREATE DATABASE pylott_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

## Update .env File

After setting the password, update `Pylott-Backend/.env`:

```env
DB_PASSWORD=pylott123
```

## Run Migrations

Once MySQL is working:

```bash
cd Pylott-Backend
npm run db:migrate
npm run db:seed
npm run db:verify
```

## Alternative: Use MySQL Workbench

If you can connect via MySQL Workbench:
1. Note the password you use to connect
2. Update `.env` with that password
3. Run migrations from command line

## Still Having Issues?

Check the MySQL error log:
```bash
tail -50 /opt/homebrew/var/mysql/*.err
```

Or contact your system administrator for help with MySQL configuration.
