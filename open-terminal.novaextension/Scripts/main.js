let projectName = ''

exports.activate = function () {
    // Register the command
    nova.commands.register("terminalOpener.openProject", openProject);
    nova.commands.register("terminalOpener.openFocused", openFocused);
    
    projectName = getProjectName()
    console.log('Extension Activated. Project: ' + projectName)
}

function getProjectName() {
    return nova.workspace.path ? 
        nova.workspace.path.split('/').pop().replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) :
        "Untitled"
}

async function openProject() {
    if (!nova.workspace.path) {
        console.error("No workspace or file is currently open");
        return;
    }
    try {
        await openAndNavigate(nova.workspace.path, "project")
    } catch (error) {
        console.error("Failed to open project terminal:", error)
    }
}

async function openFocused() {
    if (!nova.workspace.activeTextEditor?.document?.path) {
        console.error("No active editor is currently open")
        return
    }
    try {
        let path = nova.workspace.activeTextEditor.document.path
        path = path.substring(0, path.lastIndexOf("/")) + "/"
        await openAndNavigate(path, "path")
    } catch (error) {
        console.error("Failed to open focused terminal:", error)
    }
}

async function openAndNavigate(path, mode) {
    
    const projectMode = (mode === "project")
    
    // Your AppleScript (same as before but stored in a constant)
    const script = `tell application "iTerm"
        set isProjectMode to ${projectMode}
        
        -- Set up indicators
        set projectTabIndicator to "$"
        set pathTabIndicator to "/"
        
        -- Set up our search names
        set projectTabName to "Nova: " & projectTabIndicator & "${projectName}" -- Project tab marker
        set pathTabName to "Nova: " & "${projectName}" & pathTabIndicator -- Path tab marker
        
        -- First find if we have a window for this project
        set foundWindow to missing value
        set foundProjectTab to missing value
        set foundPathTab to missing value
        
        -- Look through all windows and tabs
        repeat with w in windows
            set windowTabs to tabs of w
            
            -- Check each tab in the window
            repeat with t in windowTabs
                set currentSession to current session of t
                set sessionName to name of currentSession
                
                -- Check if this is our project tab
                if sessionName is equal to projectTabName then
                    set foundWindow to w
                    set foundProjectTab to t
                end if
                
                -- Check if this is our path tab
                if sessionName is equal to pathTabName then
                    set foundWindow to w
                    set foundPathTab to t
                end if
            end repeat
            
            -- If we found our window, exit the search
            if foundWindow is not missing value then
                exit repeat
            end if
        end repeat
        
        -- Handle project mode
        if isProjectMode then
            if foundProjectTab is not missing value then
                -- Project tab exists, just select it
                tell foundWindow
                    select foundProjectTab
                end tell
                activate
            else
                -- Need to create project tab
                if foundWindow is not missing value then
                    -- We have a window, so create/replace path tab with project tab
                    tell foundWindow
                        -- Create new project tab
                        create tab with profile "Nova"
                        tell current tab
                            tell current session
                                write text "cd ${path} && clear"
                                set name to projectTabIndicator & "${projectName}"
                            end tell
                        end tell
                        activate
                    end tell
                else
                    -- No window exists, create new one
                    create window with profile "Nova"
                    set newWindow to current window
                    tell newWindow
                        tell current session
                            write text "cd ${path} && clear"
                            set name to projectTabIndicator & "${projectName}"
                        end tell
                        activate
                    end tell
                end if
            end if
        else
            -- Handle path mode
            if foundWindow is not missing value then
                -- We have a window, look for path tab
                tell foundWindow
                    if foundPathTab is not missing value then
                        -- Update existing path tab
                        tell foundPathTab
                            tell current session
                                write text "cd ${path}"
                                set name to "${projectName}" & pathTabIndicator
                            end tell
                        end tell
                        select foundPathTab
                        activate
                    else
                        -- Create new path tab
                        create tab with profile "Nova"
                        tell current tab
                            tell current session
                                write text "cd ${path} && clear"
                                set name to "${projectName}" & pathTabIndicator
                            end tell
                        end tell
                        activate
                    end if
                end tell
            else
                -- No window exists, create new one with path tab
                create window with profile "Nova"
                set newWindow to current window
                tell newWindow
                    tell current session
                        write text "cd ${path} && clear"
                        set name to "${projectName}" & pathTabIndicator
                    end tell
                    activate
                end tell
            end if
        end if
    end tell
    `.trim()
    
    console.log(script)
    
    return new Promise((resolve, reject) => {
        const process = new Process("/usr/bin/osascript", {
            args: ["-e", script]
        });
        
        // Add error logging
        let stderr = ""
        process.onStderr(line => {
            stderr += line + "\n"
            console.error("AppleScript error:", line)
        })
        
        process.onDidExit((status) => {
            if (status === 0) {
                resolve()
            } else {
                reject(new Error(`AppleScript failed with status ${status}. Error: ${stderr}`))
            }
        });
        
        try {
            process.start();
        } catch (error) {
            console.error("Failed to start process:", error)
            reject(error)
        }
    });
}
