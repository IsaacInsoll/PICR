# User Accounts

## Types
Technically there are two types of user accounts:
1. **Admin Accounts** have a username/password and need to log in
2. **Public Link** accessed by a special link that treats them as a 'public link' user EG: `picr.com/SUPERSECRETCODE`.  
This does not require a login

## Similarities
These are often treated similarly because they have a lot of shared properties / functionality including:
- They have access to a specific folder, and all files/subfolders within that folder
- They have a name, email address and possibly an avatar (see below)
- They have a level of comment permissions (see below) which allows them to comment/rate/flag files
- Visits are logged
- The user can be disabled which prevents access

## Differences
Some differences include:
- Users have to log in (IE: can't use use a special link without logging in)
- Users can create public links to folders they have access to
- Only "full admin" (User with access to root folder) users can create other users

## Avatars
PICR uses [Gravatar](https://gravatar.com/) for avatars. Basically anyone can register their email address and upload a photo which appears on all sites that support it.

Benefits include:
1. You upload an avatar once and it works across multiple sites
2. If you create a public link with an email address, we might be able to detect the avatar for that user

In the (very likely) event that an avatar hasn't been registered with gravatar then PICR will show initials on a random color.
