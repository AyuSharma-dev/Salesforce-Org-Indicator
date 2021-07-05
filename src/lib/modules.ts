import * as vscode from 'vscode';
import { storageManager } from '../extension';
const cst = require('./constants');
const { exec } = require('child_process');

export function setIndicator() {
	return getColorsList().then(function (colorList) {
		vscode.window.showQuickPick(colorList).then(async selection => {
			// the user canceled the selection
			if (!selection) {
				return;
			}
			console.log('selection-->' + selection.label);
			if( selection.label === 'Paste Your HEXCODE' ){
				const hexCode:any = await vscode.window.showInputBox();
				setColor(hexCode, true);
			}
			else{
				setColor(cst.COLOR_TO_HASH.get(selection.label), true);
			}
		});
	});
}

export function refreshInd(){
	return new Promise(async resolve=>{
		getOrgInstanceURL().then( function(result:string){
			let hexCode:string = storageManager.getValue(result);
			console.log( 'hexCode-->'+hexCode );
			return resolve(setColor( hexCode, false ));
		});
	});
}

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
					description: ''
				});
			}
		}
		catch( err ){
			console.log( 'error in getColorsList-->'+JSON.stringify(err) );
		}
		return resolve(items);
	});
}

async function setColor(hexCode: string, updateSetting: boolean) {
    try {
        const conf = vscode.workspace.getConfiguration("workbench");
        //console.log('config-->' + JSON.stringify(conf));
        let data = conf["colorCustomizations"];
        const newData = Object.assign({}, data);
        console.log('newData-->' + JSON.stringify(newData));
        newData["statusBar.background"] = hexCode;

        await conf.update("colorCustomizations", newData);
		if( updateSetting ){
			getOrgInstanceURL().then( function(result:string){
				updateWorkspaceSetting(result, hexCode)
				.then(function( result ){
					console.log( 'Settings are updated' );
				});
			} );
		}
		
		

    } catch (err) {
        console.log("Error parsing JSON string:", err);
        vscode.window.showErrorMessage('Something Went Wrong');
    }
}

function updateWorkspaceSetting( orgURL:string, hexCode:string ):Promise<Boolean>{

	return new Promise(resolve=>{
		storageManager.setValue(orgURL, hexCode);
		console.log( 'orgURL-->'+orgURL );
		console.log( 'Get Value-->'+storageManager.getValue(orgURL) );
		
	});

}

function getOrgInstanceURL():Promise<string>{
	return new Promise(async resolve=>{
		runCommand('sfdx force:org:display --json', true).then(function(result: any) {
			console.log('result==>' + result);
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