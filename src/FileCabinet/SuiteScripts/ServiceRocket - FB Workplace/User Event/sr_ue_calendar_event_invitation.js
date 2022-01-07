/*
    ID                  : customscript_sr_ue_calendar_event_invite
    Name                : SR Calendar Event Invitation UE
    Purpose             : User Event to automatically send invites to the subordinates of the organizer
    Created On          : February 19, 2021
    Author              : Ceana Technology
    Script Type         : User Event Script
    Saved Searches      : []
*/
/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search'],
/**
 * @param{record} record
 * @param{search} search
 */
function(record, search) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
        log.debug('scriptContextType', scriptContext.type);
        if(scriptContext.type == 'create'){
            setAttendees(scriptContext);
        }
    }

    function setAttendees(scriptContext) {
        try{
            var currRec = scriptContext.newRecord;

            var organizerId = currRec.getValue({
                fieldId: 'organizer'
            });

            var r1pChecker = currRec.getValue({
                fieldId: 'custevent_sr_r1p_invitees'
            });

            log.debug('r1pChecker', r1pChecker);
            if(r1pChecker){
                log.debug('organizerId', organizerId);
                if(organizerId) {
                    var calendarRecord = record.load({
                        type: 'calendarevent',
                        id: currRec.id,
                        isDynamic: true
                    });

                    var arrSubordinateIds = searchSubordinatesOfOrganizer(organizerId);
                    log.debug('arrSubordinateIds', arrSubordinateIds);

                    for(var lineCount = 0; lineCount < arrSubordinateIds.length; lineCount++) {
                        calendarRecord.selectNewLine({
                            sublistId: 'attendee'
                        });

                        calendarRecord.setCurrentSublistValue({
                            sublistId: 'attendee',
                            fieldId: 'attendee',
                            value: arrSubordinateIds[lineCount]
                        });

                        calendarRecord.commitLine({
                            sublistId: 'attendee'
                        });
                    }

                    var calendarEventId = calendarRecord.save();
                    log.debug('calendar event creation success', calendarEventId);
                }
            }
        } catch (e) {
            log.debug('error in setAttendees()', e);
        }
    }

    function searchSubordinatesOfOrganizer(organizerId) {
        var arraySubordinateIds = [];
        try {
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["supervisor","anyof",organizerId],
                        "AND",
                        ["isinactive","is","F"]
                    ],
                columns:
                    [
                        "internalid",
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC
                        }),
                    ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count",searchResultCount);
            var myPagedData = employeeSearchObj.runPaged({
                pageSize: 1000
            });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({
                    index: pageRange.index
                });
                myPage.data.forEach(function (result) {
                    var entityId = Number(result.getValue({
                        name: 'internalid'
                    }));

                    if(entityId) {
                        arraySubordinateIds.push(entityId);
                    }
                })
            });
        } catch (e) {
            log.debug('error in searchSubordinatesOfOrganizer()', e);
        }
        return arraySubordinateIds;
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
