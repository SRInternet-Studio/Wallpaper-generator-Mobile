// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::sync::Mutex;
use tauri::async_runtime::spawn;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_log::{Target, TargetKind};

// Create a struct we'll use to track the completion of
// setup related tasks
struct SetupState {
    frontend_task: bool,
    backend_task: bool,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// A custom task for setting the state of a setup task
#[tauri::command]
async fn set_complete(
    app: AppHandle,
    state: State<'_, Mutex<SetupState>>,
    task: String,
) -> Result<(), ()> {
    // Lock the state with write access
    let mut state_lock = state.lock().unwrap();
    match task.as_str() {
        "frontend" => state_lock.frontend_task = true,
        "backend" => state_lock.backend_task = true,
        _ => panic!("invalid task completed!"),
    }
    // Check if both tasks are completed
    if state_lock.backend_task && state_lock.frontend_task {
        // Setup is complete, we can close the splashscreen
        // and unhide the main window!
        if let Some(splash_window) = app.get_webview_window("splashscreen") {
            splash_window.close().unwrap();
        }
        if let Some(main_window) = app.get_webview_window("main") {
            main_window.show().unwrap();
        }
    }
    Ok(())
}

// An async function that does some heavy setup task
async fn setup(app: AppHandle) -> Result<(), ()> {
    // Set the backend task as being completed
    // Commands can be ran as regular functions as long as you take
    // care of the input arguments yourself
    set_complete(
        app.clone(),
        app.state::<Mutex<SetupState>>(),
        "backend".to_string(),
    )
    .await?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(SetupState {
            frontend_task: false,
            backend_task: false,
        }))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_sharesheet::init())
        .invoke_handler(tauri::generate_handler![greet, set_complete])
        .setup(|app| {
            // Spawn setup as a non-blocking task so the windows can be
            // created and ran while it executes
            spawn(setup(app.handle().clone()));
            // The hook expects an Ok result
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
