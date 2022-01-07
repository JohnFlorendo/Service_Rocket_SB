/**
 * lcc_lib_box.js
 * @NApiVersion 2.x
 */
define(['N/runtime', 'N/search','N/file','N/https','../Library/lcc_lib_files'],
    function (runtime, search,file,https,libFiles) {
        var baseURL = 'https://api.box.com/2.0';
        var currScript = runtime.getCurrentScript();
        var apiToken = currScript.getParameter('custscript_box_api_token');
        var fn = {};

        fn.createFolderInBOX = function(stFolder,stParentFolder) {
            var folderId = null;
            try{
                var headerObj = {
                    "Content-Type": 'application/json',
                    "Authorization": 'Bearer ' + apiToken
                };

                var objPayload = {
                    "name": stFolder,
                    "parent": {
                        "id": (stParentFolder)? stParentFolder : 0
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

        fn.getFolderInBOX = function(stFolder,stParentFolder) {
            var parentFolderId = (stParentFolder)? stParentFolder : 0
            var folderId = null;
            try{
                var headerObj = {
                    "Content-Type": 'application/json',
                    "Authorization": 'Bearer ' + apiToken
                };
                var response = https.get({
                    url: baseURL +'/folders/'+parentFolderId+'/items',
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

        fn.getAllFolders = function(){
            var arrFolder = [];
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
                        arrFolder.push({
                            name : folders[f].name,
                            id : folders[f].id
                        });
                    }
                }

            }catch (e) {
                log.debug('getFolderInBOX',e);
            }

            return arrFolder;

        }



        fn.getFolderId = function(stFolder) {
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

        fn.getFilebyFolder = function(stFolder) {
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

        fn.uploadFile = function(objFile,folderId) {

            var objResults = {};
            objResults.isSuccess = false;
            objResults.message = '';

            var boundary = fn.generateBoundary(30);

            var stURL = 'https://upload.box.com/api/2.0/files/content';
            var headerObj ={
                "Content-Type": "multipart/form-data; boundary=" + boundary,
                "Authorization" : 'Bearer ' + apiToken
            };
            var objPayload ={
                attributes : {
                    name : objFile.name,
                    parent  :{
                        id : folderId
                    }
                },
                file : objFile.getContents()
            }

            var strPayLoad = boundary +'\n' +
                'Content-Disposition: form-data; name="attributes"\n' +
                '\n' +
                '{\n' +
                '    \t"name": "'+objFile.name+'",\n' +
                '\t    "parent": {\n' +
                '\t        "id": "'+folderId+'"\n' +
                '\t    }\n' +
                '    }\n' +
                boundary +'\n' +
                'Content-Disposition: form-data; name="file"; filename="'+objFile.name+'"\n' +
                'Content-Type: application/pdf\n' +
                '\n' +
                 objFile.getContents() +'\n' +
                '(data)'+
                //'\t'+objFile.getContents()+'\n' +
                boundary;

             log.debug('strPayLoad',strPayLoad);

            try{
                var response = https.post({
                    url: stURL,
                    headers: headerObj,
                    body : strPayLoad
                });
                var objBody = response.body;
                log.debug('objBody',objBody);
                if(response.status == 200 || response.status == 201){
                    objResults.isSuccess = true;
                }else{
                    objResults.message = objBody;
                }



            }catch (e) {
                objResults.message = e.message;
                log.debug('uploadFile',e);
            }

            return objResults;
        }

        fn.generateBoundary = function(length) {
            var result           = '';
            var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            var charactersLength = characters.length;
            for ( var i = 0; i < length; i++ ) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            return '----' +result;
        }


    return fn;
});