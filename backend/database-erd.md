# Database Entity Relationship Diagram

This diagram shows the relationships between database tables in PICR.

```mermaid
erDiagram
    Users {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        varchar name
        boolean enabled
        enum commentPermissions "edit | none | read"
        integer folderId FK
        timestamp lastAccess
        enum userType "Admin | Link | User | All"
        varchar hashedPassword "nullable - Admin users"
        varchar username "nullable - Admin users"
        varchar ntfy "nullable - notification URL"
        boolean ntfyEmail
        varchar uuid "nullable - Link users"
        enum linkMode "nullable - final_delivery | proof_no_downloads"
    }

    Folders {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        varchar name
        varchar folderHash "nullable - cache key"
        varchar relativePath "nullable - null for root"
        boolean exists
        boolean existsRescan
        timestamp folderLastModified
        integer parentId FK "nullable - null for root"
        integer heroImageId FK "nullable"
    }

    Files {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        varchar name
        varchar fileHash "nullable"
        varchar blurHash "nullable - image placeholder"
        varchar relativePath
        text metadata "nullable - JSON EXIF data"
        integer rating "0-5"
        double imageRatio "nullable - width/height"
        double duration "nullable - video seconds"
        bigint fileSize
        timestamp fileLastModified
        timestamp fileCreated
        boolean exists
        boolean existsRescan
        integer totalComments "denormalized"
        timestamp latestComment "nullable"
        integer folderId FK
        enum flag "nullable - approved | none | rejected"
        enum type "nullable - File | Image | Video"
    }

    Comments {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        integer folderId FK "nullable"
        integer fileId FK "nullable"
        integer userId FK "nullable"
        boolean systemGenerated "nullable"
        varchar nickName "nullable"
        text comment "nullable"
    }

    AccessLogs {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        integer userId FK "nullable"
        integer folderId FK "nullable"
        varchar ipAddress "nullable"
        varchar sessionId "nullable"
        varchar userAgent "nullable"
        enum type "nullable - View | Download"
    }

    Brandings {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        integer folderId FK "nullable"
        varchar logoUrl "nullable"
        enum mode "nullable - auto | light | dark"
        enum primaryColor "nullable - Mantine colors"
    }

    UserDevice {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        integer userId FK "nullable"
        varchar name "nullable"
        varchar notificationToken "nullable"
        boolean enabled
    }

    ServerOptions {
        serial id PK
        timestamp createdAt
        timestamp updatedAt
        varchar lastBootedVersion "nullable"
        varchar tokenSecret "nullable"
        boolean avifEnabled "nullable"
    }

    %% Relationships
    Users ||--o{ AccessLogs : "has many"
    Users ||--o{ Comments : "has many"
    Users ||--o{ UserDevice : "has many"
    Users }o--|| Folders : "home folder"

    Folders ||--o{ Files : "contains"
    Folders ||--o{ Comments : "has many"
    Folders ||--o{ AccessLogs : "tracked in"
    Folders ||--o{ Brandings : "has"
    Folders }o--o| Folders : "parent"
    Folders }o--o| Files : "hero image"

    Files ||--o{ Comments : "has many"
```

## Table Purposes

| Table | Purpose |
|-------|---------|
| **Users** | Authentication & authorization. Admin users have username/password; Link users have UUID for public sharing. |
| **Folders** | Directory hierarchy mirroring filesystem. Self-referential for tree structure. |
| **Files** | Media files with extracted metadata. Discriminated by `type` (File/Image/Video). |
| **Comments** | User feedback on files, plus system-generated messages for workflows. |
| **AccessLogs** | Audit trail for views/downloads, primarily for Link user analytics. |
| **Brandings** | Per-folder theming for white-label public galleries. Cascades to subfolders. |
| **UserDevice** | Mobile app push notification registration. |
| **ServerOptions** | Singleton server config (JWT secret, feature flags). |

## Common Query Patterns

```typescript
// Get folder with files
const folder = await db.query.dbFolder.findFirst({
  where: eq(dbFolder.id, folderId),
  with: { files: true },
});

// Get user's accessible folders (uses picrDb.ts helpers)
const folder = await dbFolderForId(folderId); // throws if not found

// Check file exists and get it
const file = await dbFileForId(fileId); // throws if not found
```
