/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/runtime', 'N/search','N/file','N/https','../Library/lcc_lib_files'],
function(runtime, search,file,https,libFiles) {
    var baseURL = 'https://api.box.com/2.0';
    var currScript = runtime.getCurrentScript();
    var apiToken = currScript.getParameter('custscript_box_api_token');
    function execute(scriptContext) {
       try{
           var stFolder = currScript.getParameter('custscript_lcc_box_nsfolder');
           var nsFolderId = getFolderId(stFolder);
           log.debug('nsFolderId',nsFolderId);
           if(nsFolderId){
               var arrFiles = getFilebyFolder(nsFolderId);
               log.debug('arrFiles',arrFiles);
               if(arrFiles.length > 0){
                   //CREATE FOLDER IF NOT EXISTING
                   var folderId = (getFolderInBOX(stFolder)) ? getFolderInBOX(stFolder) : createFolderInBOX(stFolder);
                   log.debug('folderId',folderId);
                   if(folderId){
                       for(var indx = 0;  indx < arrFiles.length; indx++){
                           uploadFile(file.load(arrFiles[indx].fileid),folderId);
                       }
                   }
               }
           }

       }catch (e) {
           log.debug('execute-error',e);
       }
    }
    
    function  createFolderInBOX(stFolder) {
        var folderId = null;
        try{
            var headerObj = {
                "Content-Type": 'application/json',
                "Authorization": 'Bearer ' + apiToken
            };

            var objPayload = {
                "name": stFolder,
                "parent": {
                    "id": "0"
                }
            };
            log.debug('createFolderInBOX-objPayload',objPayload);

            var response = https.post({
                url: baseURL +'/folders',
                headers: headerObj,
                body : JSON.stringify(objPayload)
            });

            log.debug('createFolderInBOX-response',response);

            var objBody = JSON.parse(response.body);
            if(objBody.id){
                folderId = objBody.id;
            }
        }catch(e){
            log.debug('createFolderInBOX',e);
        }

        return folderId;
    }

    function  getFolderInBOX(stFolder) {
        var folderId = null;
        try{
            var headerObj = {
                "Content-Type": 'application/json',
                "Authorization": 'Bearer ' + apiToken
            };
            var response = https.get({
                url: baseURL +'/folders/0/items',
                headers: headerObj
            });

            log.debug('getFolderInBOX-response',response);
            var objBody = JSON.parse(response.body);
            if(objBody.entries){
                var folders = objBody.entries;
                for(var f in folders){
                    if(folders[f].name == stFolder){
                        folderId = folders[f].id;
                    }
                }
            }

        }catch (e) {
            log.debug('getFolderInBOX',e);
        }

        return folderId;
    }
    



    function  getFolderId(stFolder) {
        var folderId = null;
        try{
            var folderSearchObj = search.create({
                type: "folder",
                filters:
                    [
                        ["name","is",stFolder]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "foldersize", label: "Size (KB)"}),
                        search.createColumn({name: "lastmodifieddate", label: "Last Modified"}),
                        search.createColumn({name: "parent", label: "Sub of"}),
                        search.createColumn({name: "numfiles", label: "# of Files"})
                    ]
            });
            var searchResults = folderSearchObj.run().getRange({
                start: 0,
                end: 1
            });

            if(searchResults.length > 0){
                folderId = searchResults[0].id;
            }
        }catch (e) {
            log.debug('getFolderId',e);
        }

        return folderId;
    }
    
    function getFilebyFolder(stFolder) {
        try{
            var arrFiles = [];

            var fileSearchObj = search.create({
                type: "file",
                filters:
                    [
                        ["folder","anyof",stFolder]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Name"
                        }),
                        search.createColumn({name: "folder", label: "Folder"}),
                        search.createColumn({name: "documentsize", label: "Size (KB)"}),
                        search.createColumn({name: "url", label: "URL"}),
                        search.createColumn({name: "created", label: "Date Created"}),
                        search.createColumn({name: "modified", label: "Last Modified"}),
                        search.createColumn({name: "filetype", label: "Type"})
                    ]
            });
            var searchResultCount = fileSearchObj.runPaged().count;
            fileSearchObj.run().each(function(result){
                var objFileContent = file.load(result.id);
                var objFiles = {};
                objFiles.fileid = result.id;
                objFiles.filename = result.getValue('name');
                objFiles.content = objFileContent.getContents();

                arrFiles.push(objFiles);
                return true;
            });
        }catch (e) {
            log.debug('getFilebyFolder',e);
        }

        return arrFiles;
    }
    
    function  uploadFile(objFile,folderId) {

        var boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        var stURL = 'https://upload.box.com/api/2.0/files/content';
        var headerObj ={
            "Content-Type" : "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
            "Authorization" : 'Bearer ' + apiToken
        };

        var attrib = {
            "name": objFile.name,
            "parent": {
                "id": folderId
            }
        }

        var file = {
            'file' : objFile
        }



        /*var strPayLoad = '----WebKitFormBoundary7MA4YWxkTrZu0gW\n' +
            'Content-Disposition: form-data; name="attributes"\n' +
            '\n' +
            '{\n' +
            '    \t"name": "'+objFile.name+'",\n' +
            '\t    "parent": {\n' +
            '\t        "id": "'+folderId+'"\n' +
            '\t    }\n' +
            '    }\n';

        strPayLoad += libFiles.uploadParts([{name: objFile.name, value : objFile}]);*/

        var strPayLoad = '----WebKitFormBoundary7MA4YWxkTrZu0gW\n' +
            'Content-Disposition: form-data; name="attributes"\n' +
            '\n' +
            '{\n' +
            '    \t"name": "Test.txt",\n' +
            '\t    "parent": {\n' +
            '\t        "id": "113979439826"\n' +
            '\t    }\n' +
            '    }\n' +
            '----WebKitFormBoundary7MA4YWxkTrZu0gW\n' +
            'Content-Disposition: form-data; name="file"; filename="'+objFile.name+'"\n' +
            'Content-Type: application/pdf\n' +
            '\n' +
            '\t'+objFile.getContents()+'\n' +
            '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        log.debug('strPayLoad',strPayLoad);
        try{
            var response = https.post({
                url: stURL,
                headers: headerObj,
                body : strPayLoad
            });

            var objBody = response.body;
            log.debug('objBody',objBody);
        }catch (e) {
            log.debug('uploadFile',e);
        }
    }

    return {
        execute: execute
    };
    
});
