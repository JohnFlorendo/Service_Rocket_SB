/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */

/** THIS OBJECT CONTAINS THE FIELDS IN NETSUITE **/
var objFields = {
    BOX_FOLDER_RECORD : {
        RECORD_TYPE : "customrecord_box_record_folder",
        NETSUITE_RECORD_ID : "custrecord_ns_record_id",
        BOX_FOLDER_RECORD_ID : "custrecord_box_record_folder_id",
        NETSUITE_RECORD_TYPE : "custrecord_netsuite_record_type"
    },
    PROJECT : {
        RECORD_TYPE : "job",
        BOX_FOLDER_URL : "custentity_sr_box_folder_url"
    }
};

define(['N/record','N/search'],
    function(record, search) {

        function beforeSubmit(context) {
            try {
                var newRecord = context.newRecord;
                if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                    if(newRecord.id != '') {
                        var intFolderId = getBoxFolderId(JSON.stringify(newRecord.id), newRecord.type);

                        if(intFolderId != '') {
                            var objData = {};
                            var stURL = "https://servicerocket.box.com/s/";
                            // objData[objFields.PROJECT.BOX_FOLDER_URL] = ;
                            // record.submitFields({ type: record.Type.JOB, id: newRecord.id, values: objData });
                            newRecord.setValue(objFields.PROJECT.BOX_FOLDER_URL, stURL+intFolderId);
                        }
                    }
                }
            } catch(e) { log.debug('ERROR', e); }
        }

        function getBoxFolderId(intProjectId, stRecordType) {
            var intBoxFolderId = "";

            var recSearchObj = search.create({
                type: objFields.BOX_FOLDER_RECORD.RECORD_TYPE,
                filters: [
                    [objFields.BOX_FOLDER_RECORD.NETSUITE_RECORD_ID, 'is', intProjectId], 'AND',
                    [objFields.BOX_FOLDER_RECORD.NETSUITE_RECORD_TYPE, 'is', stRecordType]
                ],
                columns: [ search.createColumn({name: objFields.BOX_FOLDER_RECORD.BOX_FOLDER_RECORD_ID }) ]
            });

            recSearchObj.run().each(function(result) {
                intBoxFolderId = result.getValue({name:objFields.BOX_FOLDER_RECORD.BOX_FOLDER_RECORD_ID});
                return false;
            });

            return intBoxFolderId;
        }

        return {
            beforeSubmit: beforeSubmit
        };
    });