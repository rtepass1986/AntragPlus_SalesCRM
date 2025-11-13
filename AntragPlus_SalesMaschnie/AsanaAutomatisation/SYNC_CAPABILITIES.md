# 🔄 Bidirectional Sync Capabilities

## ✅ Currently Synced (Bidirectional)

### Asana → Pipedrive
- ✅ **Task title** → Deal title
- ✅ **Task description/notes** → Deal notes
- ✅ **Task completed status** → Deal won/lost status
- ✅ **Task due date** → Deal close date
- ✅ **Section changes** → Stage changes
- ✅ **Task deleted** → Deal marked as lost

### Pipedrive → Asana
- ✅ **Deal title** → Task title
- ✅ **Deal notes** → Task description
- ✅ **Deal status** → Task completed
- ✅ **Deal close date** → Task due date
- ✅ **Stage changes** → Section changes
- ✅ **Deal deleted** → Task marked complete

### Special Features
- ✅ **Initial backfill**: All contacts, emails, and deal history
- ✅ **Automation rules**: Timer start/stop, auto-assignment, date setting
- ✅ **Time tracking**: Automatic calculation when tasks complete
- ✅ **Duplicate prevention**: Checks before creating tasks

## ⚠️ Partially Synced

### Comments
- ✅ **Initial sync**: All emails added as comments during backfill
- ❌ **Real-time**: New comments NOT synced via webhook
- **Reason**: Requires separate webhook subscriptions for notes/comments

### Attachments
- ❌ **Not synced**: Files/attachments not transferred
- **Reason**: Would require file storage/transfer logic

## ❌ Not Synced

### Custom Fields (except Pipedrive Deal ID)
- ❌ Deal value, probability, custom fields
- **Reason**: Field mapping complexity, different field types

### Assignee/Owner
- ❌ Deal owner changes not synced to Asana assignee
- **Reason**: User mapping between systems not configured

### Activities
- ❌ Calls, meetings, tasks in Pipedrive
- **Reason**: Different activity models

## 🔧 To Enable Full Comment Sync

You need to set up additional webhooks in Pipedrive:

### Pipedrive Webhooks Needed:
1. **Note added** → Sync to Asana comment
2. **Note updated** → Update Asana comment
3. **Email received** → Add to Asana as comment

### Asana Webhooks Needed:
1. **Story added** (comment) → Sync to Pipedrive note

**Implementation Status**: Code structure ready, needs webhook configuration

## 📊 Summary

| Feature | Asana → Pipedrive | Pipedrive → Asana |
|---------|-------------------|-------------------|
| Title/Name | ✅ | ✅ |
| Description/Notes | ✅ | ✅ |
| Status/Completed | ✅ | ✅ |
| Due Date | ✅ | ✅ |
| Section/Stage | ✅ | ✅ |
| Deletion | ✅ | ✅ |
| Comments (initial) | ✅ | ✅ |
| Comments (real-time) | ❌ | ❌ |
| Attachments | ❌ | ❌ |
| Custom Fields | ❌ | ❌ |
| Assignee/Owner | ❌ | ❌ |
| Timer | ✅ (Asana only) | N/A |

## 🚀 Next Steps to Close Gaps

### Priority 1: Real-time Comments
```typescript
// Add to pdWebhook.ts
case 'note.added':
  await syncNoteToAsana(webhookData);
  
// Add to asanaWebhook.ts  
case 'story.added':
  await syncCommentToPipedrive(webhookData);
```

### Priority 2: Assignee Sync
- Map Pipedrive users to Asana users
- Sync owner_id ↔ assignee

### Priority 3: Custom Fields
- Map important custom fields (deal value, etc.)
- Configure field type conversions

