# Files and Folders

## Overview

- When setting up PICR you point it at a home (root) folder where all of your images are stored. EG: a folder named
  `Client Photos`. PICR will only work on files and folders under this subfolder.
- Permissions for users can be assigned to any folder or subfolder and allows access to that folder and all subfolders under that.
- No files/folders are created or uploaded in PICR, you just put the files in that folder however you normally do (IE: share that folder over the network)
- Once files are put in the folder you access PICR to created shared links.

## Example workflow

#### Initial setup

- Monique does family photography every weekend and does corporate work for a few clients.
- Monique creates a folder called `Client Photos` on her NAS, then sets up PICR and mounts that folder as the root.
- Inside `Client Photos` she creates `Corporate Clients` and `Family Photos` folders

#### Family Photo Workflow

- Every family portrait shoot she uses Lightroom to export final images to a new folder under `Family Photos` (EG: `Client Photos\Family Photos\2025 12 Atkins Family`)
- Once exported, she opens PICR, clicks 'Manage' beside the appropriate folder in the _Recently Modified Folders_ list on the dashboard.
- Inside the management she clicks enters a name 'Mr and Mrs Atkins', chooses the pretty link button, clicks 'Copy Link' and 'Create'
- She then emails them with the link she copied.
- If they do another shoot the following year, it's `2026 12 Atkins Family` and a new link

#### Corporate Clients Workflow

- Every time a new client comes onboard Monique makes a folder for the whole company EG `Porsche`
- Each shoot gets it's own folder under that EG: `2025 Taycan Shoot`, `2025 Christmas Party`
- The marketing team get a link created for the top `Porsche` folder, and they appreciate being able to see all media in the one link, with new folders appearing as new shoots are done
- If multiple users need access (EG: the CEO, the external marketing team) then Monique makes multiple public links on the same folder, so she can track _who_ is accessing the folder and revoke access if necessary
