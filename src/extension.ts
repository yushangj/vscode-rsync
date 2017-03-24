'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as rsync from 'rsync';

import * as fs from 'fs';

let out = vscode.window.createOutputChannel("Sync- Rsync");

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Should fix r to be Rsync type
    let runSync = function (r: any) {

        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        let wcfg: JSON = JSON.parse(fs.readFileSync(vscode.workspace.rootPath+'/.rsync').toString());
        let cfg_exclude: string[] = wcfg['exclude'];
        let cfg_flags: string = wcfg['flags'];
        let cfg_shell: string = wcfg['shell'];
        let cfg_delete: boolean = wcfg['delete'];
        let cfg_autoHide: boolean = wcfg['autoHideOutput'];
        if(cfg_exclude == undefined){
            cfg_exclude = config.get('exclude',[".git",".vscode"]);
        }
        if(cfg_flags == undefined){
            cfg_flags = config.get('flags','rlptzv');
        }
        if(cfg_shell == undefined){
            cfg_shell = config.get('shell',undefined);
        }
        if(cfg_delete = undefined){
            cfg_delete = config.get('delete',false);
        }
        if(cfg_autoHide = undefined){
            cfg_autoHide = config.get('autoHideOutput',true);
        }

        //console.log('exclude:'+cfg_exclude);
        //console.log('flags:'+cfg_flags);
        //console.log('delete:'+cfg_delete);
        //console.log('shell:'+cfg_shell);
        //console.log('autoHideOutput:'+cfg_autoHide);
        r = r
            .flags(cfg_flags)
            .exclude(cfg_exclude)
            .progress();

        if(cfg_shell !== undefined) {
            r = r.shell(cfg_shell);
        }

        if(cfg_delete) {
            r = r.delete()
        }

        out.show();
        r.execute(
            (error,code,cmd) => {
                if(error) {
                    vscode.window.showErrorMessage(error.message);
                } else {
                    if(cfg_autoHide) {
                        out.hide();
                    }
                }
            },
            (data: Buffer) => {
                out.append(data.toString());
            },
            (data: Buffer) => {
                out.append(data.toString());
            },
        )
    }

    let sync = function(down: boolean) {
        
        let local: string = vscode.workspace.rootPath;

        if(local === null) {
            vscode.window.showErrorMessage('Sync - Rsync: you must have a folder open');    
            return;
        }

        local = local + '/';
        
        // add workspace level config support
        let wcfg: JSON = JSON.parse(fs.readFileSync(local+'.rsync').toString());
        if(wcfg == null){
            vscode.window.showErrorMessage('Sync - Workspace Rsync is not configured');
            // create a new .rsync file and display it 
            return;
        }
        let remote: string = wcfg["remote"];
        if(remote == undefined ||
            remote.length == 0) {
            vscode.window.showErrorMessage('Sync - Workspace Rsync remote is not configured');    
            return;
        }
        remote = remote + '/';
        
        let r = new rsync();

        if(down) {
            r = r.source(remote).destination(local);
        } else {
            r = r.source(local).destination(remote);
        }
        
        runSync(r);

    }

    let syncDown = vscode.commands.registerCommand('sync-rsync.syncDown', () => {
        sync(true);
    });

    let syncUp = vscode.commands.registerCommand('sync-rsync.syncUp', () => {
        sync(false);
    });

    context.subscriptions.push(syncDown);
    context.subscriptions.push(syncUp);


    // On Save
    vscode.workspace.onDidSaveTextDocument((e: vscode.TextDocument) => {
        let config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('sync-rsync')
        let wcfg: JSON = JSON.parse(fs.readFileSync(vscode.workspace.rootPath+'/.rsync').toString());
        let onSave: boolean = wcfg['onSave'];
        if(onSave == undefined){
            onSave = config.get('onSave',false);
        }
        //console.log('onSave:'+onSave);
        
        if(onSave) {
            sync(false);
        }
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
}