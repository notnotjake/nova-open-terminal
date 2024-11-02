Current Functionality:
- Open Project in Terminal: Opens the workspace's root path up in an iTerm window
- Open Path in Terminal: Opens the currently focused document's path

Creates a new window per workspace. One tab kept for project and one is kept for opening paths (focused windows) from Nova.

**Limitations:**
Only works with iTerm2. Works using an iTerm Profile named 'Nova' with title set to 'Profile: Name'. Currently the extension uses the 'Nova' title to identify windows and tabs along with the project name which is why this setup is required. Obviously not ideal, but it works.


### Some Development Notes

Basically works entirely with an AppleScript which is the best way I found to work with iTerm2.

Terminal.app seems more accessible from shell commands.

You can open a folder directly in iTerm with `open $PATH -a iTerm` but you can't set profiles, session names, or specify how to open it (in a new window, vs a tab in a specific window). That's why I'm using AppleScript.

Kept having issues running AppleScripts, then trying to read the output in the extension, so I just put all the logic into the script and run it from the extension.
