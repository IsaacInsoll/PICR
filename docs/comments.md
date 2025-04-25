# Comments / Ratings / Flags

## Types
Comments, Ratings and Flags are three ways that users can interact with the images and other files in PICR:
- `Comment` means the user wrote a message about a specific image or folder
- `Rating` means the user gave a rating to a specific image between 0 and 5 stars. Zero is considered "unrated"
- `Flag` means the user marked a specific image as "approved" or "rejected"

These were inspired by how lightroom and other photo management software work.

## Permissions

There are three levels of permissions for "Comments" which covers permissions to all three of the above:
- `None` You can't see or set any comments, ratings or flags. The user would have no idea these features even exist.
- `View` The user can see comments, ratings and flags but they can't add comments or set ratings/flags.
- `Edit` The user can see and edit all comments, ratings and flags.

## How to use

You should decide how you want to use these features then let the client know.

Typically you would decide on either using `Flag` or `Rating` then when sending the link to the client include a message like either:

- Please mark `approve` on the images you would like me to edit and send through in full resolution, leave  comments if you have editing notes for specific images.
- Please rate images on a scale of 1 to 5 stars where 5 is best. If you have trouble deciding then do a "good enough" pass for 1 star images, then filter for those and mark the best ones 2 stars, then repeat the process.

Once the client has done this you can easily log in and filter for just `approved` or appropriately rated images and take action.

> If there are workflow features you would love to see in PICR that don't yet exist, please open an issue on GitHub to let us know!