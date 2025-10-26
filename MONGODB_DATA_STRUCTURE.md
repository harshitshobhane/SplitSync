# MongoDB Data Structure - SplitSync

## Database: `splitsync`

### Collections

#### 1. users
- Stores user account information
- Each user has unique `firebase_uid`
- Auto-created on first login

#### 2. expenses
- Stores all expense transactions
- Linked to user via `user_id`
- Tracks splitting details

#### 3. transfers
- Stores money transfers between people
- Linked to user via `user_id`

#### 4. settings
- Stores user preferences
- Linked to user via `user_id`
- Defaults created if none exist

---

## Security

✅ All endpoints require JWT authentication
✅ Data is user-specific (filtered by `user_id`)
✅ Cannot access other users' data

