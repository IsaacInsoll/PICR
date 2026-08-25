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
- Public links can optionally have an expiration date and time

## Differences

Some differences include:

- Users have to log in (IE: can't use use a special link without logging in)
- Users can create public links to folders they have access to
- Only "full admin" (User with access to root folder) users can create other users

## Public link expiration

An administrator can set an optional expiration date and time while creating or
editing a public link. The time is entered in the administrator's local timezone.
After that instant, PICR no longer accepts the link ID for gallery access. Clearing
the expiration makes the link available indefinitely again, provided it is enabled
and has not been deleted. Visitors opening an expired link see the expiration time
and are prompted to contact the photographer for a replacement link.

Expiration controls access to the gallery API. It does not retract files that a
visitor has already downloaded, and it does not revoke an image or video URL that
has already been obtained independently of the gallery page.

## Avatars

PICR uses [Gravatar](https://gravatar.com/) for avatars. If a user's username is
an email address, PICR creates a SHA256 hash of that email address and uses it to
request the user's Gravatar image.

In the event that an avatar hasn't been registered with Gravatar, PICR will show
initials on a random color.
