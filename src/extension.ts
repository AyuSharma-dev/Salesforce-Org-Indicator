// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { LocalStorageService } from './lib/LocalStorageService';
import { refreshInd, setIndicator } from './lib/modules';
export let storageManager:LocalStorageService;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "salesforce-org-indicator" is now active!');

	storageManager = new LocalStorageService(context.globalState);
	refreshInd( context, true );

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let setindicator = vscode.commands.registerCommand('salesforce-org-indicator.setindicator', async () => {
		
		try {
			setIndicator();
		} catch (error) {
			console.log( 'error-->'+JSON.stringify(error) );
		}
		
    });
	
    let refreshIndicator = vscode.commands.registerCommand('salesforce-org-indicator.refreshIndicator', async () => {
		try {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Refreshing ORG Indicator",
				cancellable: true
				}, () => {
				return refreshInd( context, false );
			});
		} catch (error) {
			console.log( 'error-->'+JSON.stringify(error) );
		}
    });

    context.subscriptions.push(setindicator);
    context.subscriptions.push(refreshIndicator);
}



// this method is called when your extension is deactivated
export function deactivate() {}