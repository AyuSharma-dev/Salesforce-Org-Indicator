import * as vscode from 'vscode';
import { storageManager } from '../extension';
const cst = require('./constants');
const { exec } = require('child_process');

//Method Sets Indicator Color, it shows Color Selection Quick Pick
export function setIndicator() {
	return getColorsList().then(function (colorList) {
		try{
			vscode.window.showQuickPick(colorList).then(async selection => {
				// the user canceled the selection
				if (!selection) {
					return; //Return if no selection
				}
				console.log('selection-->' + selection.label);
				if( selection.label === 'Paste Your HEXCODE' ){
					const hexCode:any = await vscode.window.showInputBox();
					return setColorWithProgress(hexCode, true);
				}
				else{
					return setColorWithProgress(cst.COLOR_TO_HASH.get(selection.label), true);
				}
			});
		}
		catch( err ){
			vscode.window.showErrorMessage( 'Unable to Set Org Indicator.' );
			return false;
		}
	});
}


//Method contains logic to Refresh the Org color
export function refreshInd( context: vscode.ExtensionContext, onStartup: boolean ){
	return new Promise(async resolve=>{
		try{
			getOrgInstanceURL().then( function(result:string){
				if( result === 'undefined' ){ //If No Instance URL is returned.
					if( !onStartup ){ vscode.window.showErrorMessage('Unable to Refresh Org Indicator.'); }
					return resolve(false);
				}
				let hexCode:string = storageManager.getValue(result);
				if( onStartup ){  createStatusBarItem( context );  } //Only Create Status Bar Item on Startup
				return resolve(setColor( hexCode, false ));
			});
		}
		catch( err ){
			vscode.window.showErrorMessage( 'Unable to Refresh Org Indicator.' );
			return resolve(false);
		}
		
	});
}


//Method creates Status Bar Item to Refresh Indicator Color
function createStatusBarItem( context: vscode.ExtensionContext ){
	let myStatusBarItem: vscode.StatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 0);
	myStatusBarItem.command = 'salesforce-org-indicator.refreshIndicator';
	myStatusBarItem.text = '🌌';
	myStatusBarItem.name = 'Refresh Org Indicator';
	myStatusBarItem.tooltip = 'Refresh Org Indicator';
	context.subscriptions.push(myStatusBarItem);
	myStatusBarItem.show();
}


//Method gets the Colors list for Quick Pick
function getColorsList():Promise<vscode.QuickPickItem[]> {
	return new Promise( resolve=>{
		let items: vscode.QuickPickItem[] = [];
		try{
			
			let colorsList:string[] = Array.from(cst.COLOR_TO_HASH.keys());
			colorsList.push( 'Paste Your HEXCODE' );
			for (let index = 0; index < colorsList.length; index++) {
				let item = colorsList[index];
				items.push({
					label: item,
					description: '' // Colors need no fucking description
				});
			}
		}
		catch( err ){
			console.log( 'error in getColorsList-->'+JSON.stringify(err) );
		}
		return resolve(items);
	});
}


//Method Calls the SetColor method within a withProgress.
function setColorWithProgress( hexCode: string, updateSetting: boolean ){
	vscode.window.withProgress({
		location: vscode.ProgressLocation.Notification,
		title: "Setting ORG Indicator",
		cancellable: true
		}, () => {
			return setColor( hexCode, updateSetting );
		});
}


//Method Updates the Status Bar color.
function setColor(hexCode: string, updateSetting: boolean) {
	return new Promise(async resolve=>{
		try {
			const conf = vscode.workspace.getConfiguration("workbench");
			let data = conf["colorCustomizations"]; //Getting existing customization
			const newData = Object.assign({}, data); //Cloning the object as the original is not writable
			newData["statusBar.background"] = hexCode;
			if( !updateSetting ){  
				await conf.update("colorCustomizations", newData);
				return resolve(true);
				}
			if( updateSetting ){
				getOrgInstanceURL().then(async function(result:string){
					if( result === 'undefined' ){ //If no Instance URL is returned
						vscode.window.showErrorMessage('Unable to Set Org Indicator.');
						return resolve(false);
					}
					conf.update("colorCustomizations", newData).then( function(){
						updateWorkspaceSetting(result, hexCode)
						.then( function(){
							return resolve(true);
						});
					});
				});
			}
			
		} catch (err) {
			console.log("Error parsing JSON string:", err);
			vscode.window.showErrorMessage('Unable to Set Org Indicator.');
		}
	});
}


//Method updates the information in Memento data
function updateWorkspaceSetting( orgURL:string, hexCode:string ):Promise<Boolean>{

	return new Promise(resolve=>{
		storageManager.setValue(orgURL, hexCode);
		return resolve( true );
	});

}


//Method gets the Org instance URL 
function getOrgInstanceURL():Promise<string>{
	return new Promise(async resolve=>{
		runCommand('sfdx force:org:display --json', true).then(function(result: any) {
			console.log('result==>' + result);
			if( result === undefined || result.result === undefined ){
				return resolve('undefined');
			}
			return resolve(result.result.instanceUrl);
		});
	});
}


//Method runs the Passed command into the Terminal with SFDX directory.
function runCommand(command: string, readOutput: boolean): any {

    return new Promise(resolve => {
        var outputJson = '';
        //let currentPanel: vscode.WebviewPanel | undefined = undefined;
        if (vscode.workspace.workspaceFolders === undefined) {
            return;
        }
        let foo = exec(command, {
            maxBuffer: 1024 * 1024 * 6,
            cwd: vscode.workspace.workspaceFolders[0].uri.fsPath
        });

        foo.stdout.on("data", (dataArg: string) => {
            try {
                outputJson += dataArg;
            } catch (err) {
                console.log('err-->' + err.message);
            }
        });

        foo.on('close', (data: string) => {
            if (readOutput) {
                return resolve(JSON.parse(outputJson));
            } else {
                return resolve(JSON.parse('{"Not":"Required"}'));
            }

        });

    });
}