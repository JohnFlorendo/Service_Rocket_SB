define(['N/https', 'N/search', 'N/record', 'N/file', 'N/url', 'N/render', 'N/crypto', 'N/format', 'N/runtime', './moment.js'],
    /**
     * @param{https} https
     * @param{search} search
     * @param{record} record
     * @param{file} file
     * @param{url} url
     * @param{render} render
     * @param{crypto} crypto
     * @param{moment} moment
     * @param{format} format
     */
    function (https, search, record, file, url, render, crypto, format, runtime, moment) {
        
        var fn = {};
        fn.ACCESS_TOKEN = '';
        fn.HOST = '';
        fn.WorkplaceConfiguration = function (stConfigId) {
            var objConfig = {
                TokenKey: '',
                Host: ''
            };
            try {
                var recConfig = record.load({
                    type: 'customrecord_int_config_workplace',
                    id: stConfigId
                });
                objConfig.TokenKey = recConfig.getValue('custrecord_int_wp_access_token');
                objConfig.Host = recConfig.getValue('custrecord_int_wp_host');
                
            } catch (e) {
                log.debug('getAccessToken', e);
            }
            return objConfig;
        }
        
        fn.sendMessage = function (stHost, stAccessToken, stSenderId, stMessage) {
            var objResult = {
                success: false,
                message: "",
                message_id: ""
            }
            
            var stURL = stHost + '/v7.0/me/messages?access_token=' + stAccessToken;
            
            var headers = [];
            headers['Content-Type'] = 'application/json';
            var objBody = {
                "messaging_type": "UPDATE",
                "recipient": {
                    "id": stSenderId
                },
                "message": {
                    "text": stMessage,
                }
            };
            
            var objResponse = https.post({
                headers: headers,
                url: stURL,
                body: JSON.stringify(objBody),
            });
            var objResponseBody = JSON.parse(objResponse.body);
            //VALIDATE IF THERE'S AN ERROR
            if (objResponseBody.error) {
                objResult.message = objResponseBody.error;
            } else {
                if (objResponseBody.message_id) {
                    objResult.success = true;
                    objResult.message_id = objResponseBody.message_id;
                }
            }
            
            return objResult;
        };
        
        fn.sendAttachment = function (stHost, stAccessToken, stSenderId, stFileURL) {
            
            var stAttachedId = null;
            var stURL = stHost + '/v7.0/me/message_attachments?access_token=' + stAccessToken;
            var headers = [];
            headers['Content-Type'] = 'application/json';
            
            var objAttachment = {
                "type": stFileURL.type,
                "payload": {
                    "is_reusable": true,
                    "url": stFileURL.url
                }
            };
            
            var objBody = {
                "recipient": {
                    "id": stSenderId
                },
                "message": {
                    "attachment": objAttachment
                }
            };
            
            var objResponse = https.post({
                headers: headers,
                url: stURL,
                body: JSON.stringify(objBody),
            });
            var objResponseBody = JSON.parse(objResponse.body);
            log.debug("objResponseBody", objResponseBody);
            if (objResponseBody.attachment_id) {
                stAttachedId = objResponseBody.attachment_id;
            }
            
            return stAttachedId;
        };
        
        fn.sendMessageWithAttachment = function (stHost, stAccessToken, stSenderId, stAttachment, stFileURL) {
            var objResult = {
                success: false,
                message: "",
                message_id: ""
            }
            
            var stURL = stHost + '/v7.0/me/messages?access_token=' + stAccessToken;
            var headers = [];
            headers['Content-Type'] = 'application/json';
            var objBody = {
                "recipient": {
                    "id": stSenderId
                },
                "message": {
                    "attachment": {
                        "type": stFileURL.type,
                        "payload": {
                            "url": stFileURL.url
                        }
                    }
                }
            };
            var objResponse = https.post({
                headers: headers,
                url: stURL,
                body: JSON.stringify(objBody),
            });
            var objResponseBody = JSON.parse(objResponse.body);
            //VALIDATE IF THERE'S AN ERROR
            if (objResponseBody.error) {
                objResult.message = objResponseBody.error;
            } else {
                if (objResponseBody.message_id) {
                    //stMesageId = objResponseBody.message_id;
                    objResult.success = true;
                    objResult.message_id = objResponseBody.message_id;
                }
            }
            return objResult;
        }
        
        fn.getMessage = function (stHost, stAccessToken, stMessageId) {
            var stFields = '&fields=message,from';
            var stURL = stHost + '/v7.0/' + stMessageId + '?access_token=' + stAccessToken + stFields;
            var headers = [];
            headers['Content-Type'] = 'application/json';
            var objResponse = https.get({
                headers: headers,
                url: stURL,
            });
            var objResponseBody = objResponse.body;
            return objResponseBody;
        };
        
        fn.RIPEmployeeIds = function (arr, objFBWorkchatAppConfig) {
            try {
                var arrRIPEmployeeIds = [];
                var employeeSearchObj = search.create({
                    type: "employee",
                    filters:
                        [
                            ["custentity_sr_r1p_enabled", "is", "T"],
                            "AND",
                            ["isinactive", "is", "F"],
                            "AND",
                            ["internalid", "is", arr]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "entityid",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "email", label: "Email"}),
                            search.createColumn({name: "phone", label: "Phone"}),
                            search.createColumn({name: "altphone", label: "Office Phone"}),
                            search.createColumn({name: "fax", label: "Fax"}),
                            search.createColumn({name: "supervisor", label: "Supervisor"}),
                            search.createColumn({name: "title", label: "Job Title"}),
                            search.createColumn({name: "job", label: "Job"}),
                            search.createColumn({name: "altemail", label: "Alt. Email"}),
                            search.createColumn({name: "custentity_pmo_third_party", label: "Third Party"}),
                            search.createColumn({name: "custentity_employee_number", label: "Employee Number"}),
                            search.createColumn({
                                name: "custentity_restrictexpensify",
                                label: "Restrict Access to Expensify"
                            }),
                            search.createColumn({name: "custentity_atlas_chr_hr_rep", label: "HR Manager"}),
                            search.createColumn({name: "custentity_rss_website", label: "Website"}),
                            search.createColumn({name: "custentity_rss_linkedin", label: "LinkedIn"}),
                            search.createColumn({name: "custentity_workplace_id", label: "Workplace Id"}),
                            search.createColumn({name: "workcalendar", label: "Work Calendar"}),
                            search.createColumn({name: "custentity4", label: "Business Unit"}),
                            search.createColumn({name: "department", label: "Department"}),
                            search.createColumn({name: "job", label: "Job"})
                        ]
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                employeeSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var objR1PEmployee = {};
                    objR1PEmployee.type = objFBWorkchatAppConfig.type;
                    objR1PEmployee.message = objFBWorkchatAppConfig.message;
                    objR1PEmployee.config = objFBWorkchatAppConfig.config;
                    objR1PEmployee.id = result.id;
                    objR1PEmployee.recipient = result.getValue('entityid');
                    objR1PEmployee.workplaceid = result.getValue('custentity_workplace_id');
                    objR1PEmployee.calendar = result.getValue('workcalendar');
                    objR1PEmployee.unit = result.getText('custentity4');
                    objR1PEmployee.department = result.getText('department');
                    objR1PEmployee.job = result.getText('job');
                    arrRIPEmployeeIds.push(objR1PEmployee);
                    return true;
                });
            } catch (e) {
                log.error("fn.RIPEmployeeIds:", e);
            }
            return arrRIPEmployeeIds;
        }
        
        
        fn.getEmployees = function (objFBWorkchatAppConfig) {
            var arrEmployees = [];
            try {
                var employeeSearchObj = search.load({
                    id: objFBWorkchatAppConfig.savedsearch
                });
                var searchResultCount = employeeSearchObj.runPaged().count;
                employeeSearchObj.run().each(function (result) {
                    var objR1PEmployee = {};
                    objR1PEmployee.type = objFBWorkchatAppConfig.type;
                    objR1PEmployee.message = objFBWorkchatAppConfig.message;
                    objR1PEmployee.config = objFBWorkchatAppConfig.config;
                    objR1PEmployee.id = result.id;
                    objR1PEmployee.recipient = result.getValue('entityid');
                    objR1PEmployee.workplaceid = result.getValue('custentity_workplace_id');
                    objR1PEmployee.calendar = result.getValue('workcalendar');
                    objR1PEmployee.unit = result.getText('custentity4');
                    objR1PEmployee.department = result.getText('department');
                    objR1PEmployee.job = result.getText('job');
                    
                    arrEmployees.push(objR1PEmployee);
                    return true;
                });
            } catch (e) {
                log.debug('fn.getEmployees ', e);
            }
            
            return arrEmployees;
        }
        
        fn.getNextHoliday = function (stCalendar) {
            var stHoliday = null;
            try {
                var objHolidays = fn.getCalendars(stCalendar);
                var today = new Date();
                var firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                for (var holiday in objHolidays) {
                    var holiday = new Date(holiday);
                    if (holiday > today) {
                        stHoliday = "The next upcoming Public Holiday for your location is: " + fn.convertToSuffix[holiday.getDate()] + " of " + fn.convertToMonth[holiday.getMonth()] + ", " + holiday.getFullYear();//objHolidays[holiday];
                        break;
                    }
                }
            } catch (e) {
                log.debug('fn.getNextHoliday ', e);
            }
            return stHoliday;
            
        }
        
        fn.numberWeeks = function (date) {
            var d = new Date(+date);
            d.setHours(0, 0, 0);
            d.setDate(d.getDate() + 4 - (d.getDay() || 7));
            return Math.ceil((((d - new Date(d.getFullYear(), 0, 1)) / 8.64e7) + 1) / 7);
        };
        
        fn.getCalendars = function (stWorkCalendarId) {
            var objCalendars = {};
            try {
                var recCalendar = record.load({
                    type: 'workcalendar',
                    id: stWorkCalendarId
                });
                var lineCount = recCalendar.getLineCount('workcalendarexception');
                
                for (var indx = 0; indx < lineCount; indx++) {
                    var dtExceptionDate = recCalendar.getSublistValue({
                        sublistId: 'workcalendarexception',
                        fieldId: 'exceptiondate',
                        line: indx
                    });
                    var stDescription = recCalendar.getSublistValue({
                        sublistId: 'workcalendarexception',
                        fieldId: 'description',
                        line: indx
                    })
                    if (objCalendars[dtExceptionDate] == null) {
                        objCalendars[dtExceptionDate] = stDescription
                    }
                }
            } catch (e) {
                log.debug('fn.getCalendars=>', e);
            }
            return objCalendars;
        }
        fn.getWorkCalendars = function () {
            var objCalendars = {};
            try {
                
                var arrWorkCalendars = fn.getListWorkCalendar();
                
                if (arrWorkCalendars.length > 0) {
                    for (var wcId in arrWorkCalendars) {
                        var stWorkCalendarId = arrWorkCalendars[wcId];
                        
                        if (objCalendars[stWorkCalendarId] == null) {
                            objCalendars[stWorkCalendarId] = {};
                        }
                        
                        var recCalendar = record.load({
                            type: 'workcalendar',
                            id: stWorkCalendarId
                        });
                        var lineCount = recCalendar.getLineCount('workcalendarexception');
                        
                        for (var indx = 0; indx < lineCount; indx++) {
                            var dtExceptionDate = recCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'exceptiondate',
                                line: indx
                            });
                            var stDescription = recCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'description',
                                line: indx
                            })
                            if (objCalendars[dtExceptionDate] == null) {
                                objCalendars[dtExceptionDate] = stDescription
                            }
                        }
                    }
                }
                
            } catch (e) {
                log.debug('getWorkCalendar', e);
            }
            
            return objCalendars;
        }
        
        fn.getListWorkCalendar = function () {
            var arrWCID = [];
            try {
                var workcalendarSearchObj = search.create({
                    type: "workcalendar",
                    filters: [],
                    columns: [
                        "name",
                    ]
                });
                workcalendarSearchObj.run().each(function (result) {
                    arrWCID.push(result.id);
                    return true;
                });
            } catch (e) {
                log.debug("getListWorkCalendar=>e", e);
            }
            return arrWCID;
        }
        
        fn.getPDFFile = function (stFileId) {
            var pdfURL = null;
            
            var baseURL = 'https://';
            baseURL += url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            
            try {
                var objFile = file.load({
                    id: stFileId
                });
                
                var urlLink = fn.getURL('customscript_sr_sl_fb_workplace_filename', 'customdeploy_sr_sl_fb_workplace_filename');
                urlLink += '&fileid=' + stFileId;
                
                pdfURL = {
                    url: urlLink,//baseURL + urlLink,
                    type: fn.getFileType[objFile.fileType]
                }
                
            } catch (e) {
                log.debug('fn.getPDFFile', e);
            }
            return pdfURL;
        };
        
        fn.getURL = function (stScript, stDeployment) {
            var urlLink = url.resolveScript({
                scriptId: stScript,
                deploymentId: stDeployment,
                returnExternalUrl: true
            });
            
            return urlLink;
        }
    
        fn.createWorkSchedulePDF = function (stTractionSearchId, stWeek, stYear, stEmployeeName, stEmployeeId, stEmpUnit, stEmpDepartment, stEmpJob) {
            var fileId = null;
            try {
                var today = new Date();
            
                //***********TEMPLATE VERSIONS**********/
            
                //Version 1.9.0
                // var tmpPage1 = file.load({id : '../Template/service_rocket_r1p.html'});
            
                //Version 1.9.1
                //var tmpPage1 = file.load({ id: '../Template/service_rocket_r1p_v1_1.html' });
            
                //Version 1.9.2 and Version 1.9.3
                //*var tmpPage1 = file.load({id: '../Template/service_rocket_r1p_v1_2.html'});
    
                //Version 1.9.4
                //var tmpPage1 = file.load({id: '../Template/service_rocket_r1p_v1_3.html'});
    
                //Version 1.9.5
                //var tmpPage1 = file.load({id: '../Template/service_rocket_r1p_v1_4.html'});
    
                //Version 1.9.6
                // var tmpPage1 = file.load({id: '../Template/service_rocket_r1p_v1_6.html'});

                //Version 1.9.7
                var tmpPage1 = file.load({id: '../Template/service_rocket_r1p_v1_7.html'});

                //*****************************************/
            
                var renderer = render.create();
                var xmlStr = '<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
                xmlStr += tmpPage1.getContents();
                renderer.templateContent = xmlStr;
                /*         renderer.addRecord('record',recOppurtunity);*/
                var arrData = fn.getPDFObjectRecord(stEmployeeId, stTractionSearchId);
                log.debug("arrdata", arrData);
                var objPlannedEvents = fn.buildPlannedEventTableRows(arrData.plannedevents);
                var objEvents = fn.buildEventTableRows(arrData.importantevents);
            
            
                var firstDayAndLastDayOfTheWeek = fn.firstDayAndLastDayOfTheWeek(stEmployeeId);
                var firstDayOfWeekText = firstDayAndLastDayOfTheWeek.firstDayOfWeekText /*fn.setmmddyyyy(firstDayAndLastDayOfTheWeek.firstDayOfWeekText);*/
                var lastDayOfWeekText = firstDayAndLastDayOfTheWeek.lastDayOfWeekText /*fn.setmmddyyyy(firstDayAndLastDayOfTheWeek.lastDayOfWeekText);*/
                var firstDayOfWeekDate = fn.setmmddyyyy(firstDayAndLastDayOfTheWeek.firstDayOfWeekText);
                var lastDayOfWeekDate = fn.setmmddyyyy(firstDayAndLastDayOfTheWeek.lastDayOfWeekText);
            
                var objDayParsing = fn.DayParsing(arrData, firstDayOfWeekDate, lastDayOfWeekDate);
                var dtRenderWeeks = fn.renderWeeks(firstDayAndLastDayOfTheWeek.firstDayOfWeekText, firstDayAndLastDayOfTheWeek.lastDayOfWeekText);
                var objBuildPdf = fn.buildPDFTemplate(objDayParsing, dtRenderWeeks)
                var dtGeneratedDateTime = fn.dateToday();
                var dtGeneratedMonth = fn.monthToday();
            
                renderer.templateContent = renderer.templateContent.replace('{businessUnit}', fn.replaceAmpersand(stEmpUnit));
                renderer.templateContent = renderer.templateContent.replace('{empDepartment}', replaceAmp(stEmpDepartment));
                renderer.templateContent = renderer.templateContent.replace('{empJob}', fn.replaceAmpersand(stEmpJob));
                renderer.templateContent = renderer.templateContent.replace('{firstDayOfWeekText}', firstDayOfWeekText);
                renderer.templateContent = renderer.templateContent.replace('{lastDayOfWeekText}', lastDayOfWeekText);
                renderer.templateContent = renderer.templateContent.replace('{dtGeneratedDate}', dtGeneratedDateTime.date);
                renderer.templateContent = renderer.templateContent.replace('{dtGenerateTime}', dtGeneratedDateTime.time);
                renderer.templateContent = renderer.templateContent.replace('{dtGeneratedMonth}', dtGeneratedMonth);
                renderer.templateContent = renderer.templateContent.replace('{PDFValues}', objBuildPdf);
                renderer.templateContent = renderer.templateContent.replace('{thismonth}', arrData.month);
                renderer.templateContent = renderer.templateContent.replace('{objPlannedEvents}', objPlannedEvents);
                renderer.templateContent = renderer.templateContent.replace('{objEvents}', objEvents);
                renderer.templateContent = renderer.templateContent.replace('{ytd}', fn.setFY(stYear));
                renderer.templateContent = renderer.templateContent.replace('{weeknumber}', stWeek);
                renderer.templateContent = renderer.templateContent.replace('{weeknumber1}', stWeek);
                renderer.templateContent = renderer.templateContent.replace('{user.name}', fn.replaceAmpersand(stEmployeeName));
            
                //Version 1.9.4
                //Allocated
                renderer.templateContent = renderer.templateContent.replace('{AllocatedPercentage}', arrData.nextWeekSummary.percentage.toString() + "%");
                renderer.templateContent = renderer.templateContent.replace('{AllocatedHours}', arrData.nextWeekSummary.durations.toString() + "h");
                renderer.templateContent = renderer.templateContent.replace('{AllocatedVariance}', arrData.nextWeekSummary.variance);
            
                //Missing
                renderer.templateContent = renderer.templateContent.replace('{MissingPercentage}', arrData.nextWeekSummary.missingPercentage.toString() + "%");
                renderer.templateContent = renderer.templateContent.replace('{MissingHours}', arrData.nextWeekSummary.missingDurations.toString() + "h");
                renderer.templateContent = renderer.templateContent.replace('{MissingVariance}', arrData.nextWeekSummary.missingVariance);
            
                //Holiday and Events
                renderer.templateContent = renderer.templateContent.replace('{EventsTotal}', arrData.nextWeekSummary.countEmployeeHoliday);
                renderer.templateContent = renderer.templateContent.replace('{HolidayTotal}', arrData.nextWeekSummary.countTractionEvents);
                renderer.templateContent = renderer.templateContent.replace('{CompanyEventTotal}', arrData.nextWeekSummary.countTotal);
            
                //PTO
                renderer.templateContent = renderer.templateContent.replace('{ThisWeekPTO}', arrData.nextWeekSummary.nextWeekPTO);
                renderer.templateContent = renderer.templateContent.replace('{TakePTO}', arrData.nextWeekSummary.takenPTO);
                renderer.templateContent = renderer.templateContent.replace('{LeftPTO}', arrData.nextWeekSummary.leftPTO);
            
                //    var fileName = stEmployeeName + stYear+'.W'+stWeek +'_'+today.getTime() +'.pdf';
    
                //Version 1.9.5
                renderer.templateContent = renderer.templateContent.replace('{secondpageYTD}', fn.setFY(stYear));
                renderer.templateContent = renderer.templateContent.replace('{secondpagedtGeneratedMonth}', dtGeneratedMonth);
                renderer.templateContent = renderer.templateContent.replace('{secondpageweeknumber}', stWeek);
                renderer.templateContent = renderer.templateContent.replace('{secondpagefirstDayOfWeekText}', firstDayOfWeekText);
                renderer.templateContent = renderer.templateContent.replace('{secondpagelastDayOfWeekText}', lastDayOfWeekText);
                renderer.templateContent = renderer.templateContent.replace('{secondpagelines}', fn.createNoteLine());
    
                //Version 1.9.6
                renderer.templateContent = renderer.templateContent.replace('{thisWeekLogged}', Math.round(arrData.thisWeekSummary.weekLogged).toString() + "%");
                renderer.templateContent = renderer.templateContent.replace('{thisWeekMissing}', Math.round(arrData.thisWeekSummary.weekMissing).toString() + "%");
                renderer.templateContent = renderer.templateContent.replace('{thisWeekEvents}', Math.round(arrData.thisWeekSummary.weekEvents));
                renderer.templateContent = renderer.templateContent.replace('{thisWeekPto}', Math.round(arrData.thisWeekSummary.weekPTO));

                //Version 1.9.7
                renderer.templateContent = renderer.templateContent.replace('{managersMessage}', fn.checkMessageFromManager(stEmployeeId, firstDayOfWeekText, lastDayOfWeekText));
                
                var fileName = stEmployeeName + stYear + '.W' + stWeek + '.pdf';
                var objFile = renderer.renderAsPdf();
                objFile.name = fileName;
                objFile.isOnline = true;
                objFile.folder = 6061;
                fileId = objFile.save();
            
            
            } catch (e) {
                log.debug('fn.createWorkSchedulePDF', e);
                return e;
            }
            return fileId;
        }
        
        fn.DayParsing = function (arrData, firstDayOfWeekText, lastDayOfWeekText) {
            var arrWeeks = {
                Monday: [],
                Tuesday: [],
                Wednesday: [],
                Thursday: [],
                Friday: []
            };
            if (!(fn.ArrayChecker(arrData.importantevents))) {
                for (var index = 0; index < arrData.importantevents.length; index++) {
                    var testdate = arrData.importantevents[index].date;
                    testdate = format.parse({value: testdate, type: format.Type.DATE})
                    var day = testdate.getDay();
                    ;
                    var objMonday = {};
                    var objTuesday = {};
                    var objWednesday = {};
                    var objThursday = {};
                    var objFriday = {};
                    var dtCheck = fn.setmmddyyyy(testdate);
                    if (fn.BetweenDatesValidation(firstDayOfWeekText, lastDayOfWeekText, dtCheck)) {
                        if (day == 1) {
                            objMonday.name = arrData.importantevents[index].name;
                            objMonday.date = arrData.importantevents[index].date;
                            objMonday.type = arrData.importantevents[index].type;
                            objMonday.img = arrData.importantevents[index].img;
                            arrWeeks.Monday.push(objMonday);
                        } else if (day == 2) {
                            objTuesday.name = arrData.importantevents[index].name;
                            objTuesday.date = arrData.importantevents[index].date;
                            objTuesday.type = arrData.importantevents[index].type;
                            objTuesday.img = arrData.importantevents[index].img;
                            arrWeeks.Tuesday.push(objTuesday);
                        } else if (day == 3) {
                            objWednesday.name = arrData.importantevents[index].name;
                            objWednesday.date = arrData.importantevents[index].date;
                            objWednesday.type = arrData.importantevents[index].type;
                            objWednesday.img = arrData.importantevents[index].img;
                            arrWeeks.Wednesday.push(objWednesday);
                        } else if (day == 4) {
                            objThursday.name = arrData.importantevents[index].name;
                            objThursday.date = arrData.importantevents[index].date;
                            objThursday.type = arrData.importantevents[index].type;
                            objThursday.img = arrData.importantevents[index].img;
                            arrWeeks.Thursday.push(objThursday);
                        } else if (day == 5) {
                            objFriday.name = arrData.importantevents[index].name;
                            objFriday.date = arrData.importantevents[index].date;
                            objFriday.type = arrData.importantevents[index].type;
                            objFriday.img = arrData.importantevents[index].img;
                            arrWeeks.Friday.push(objFriday);
                        }
                        
                    }
                }
            }
            
            for (var index = 0; index < arrData.plannedevents.length; index++) {
                var testdate = arrData.plannedevents[index].date;
                testdate = format.parse({value: testdate, type: format.Type.DATE})
                var day = testdate.getDay();
                if (day == 1 || day == 2 || day == 3 || day == 4 || day == 5) {
                    var objMonday = {};
                    var objTuesday = {};
                    var objWednesday = {};
                    var objThursday = {};
                    var objFriday = {};
                    var dtCheck = fn.setmmddyyyy(testdate);
                    if (fn.BetweenDatesValidation(firstDayOfWeekText, lastDayOfWeekText, dtCheck)) {
                        if (day == 1) {
                            objMonday.name = arrData.plannedevents[index].name;
                            objMonday.date = arrData.plannedevents[index].date;
                            objMonday.type = arrData.plannedevents[index].type;
                            objMonday.img = arrData.plannedevents[index].img;
                            arrWeeks.Monday.push(objMonday);
                        } else if (day == 2) {
                            objTuesday.name = arrData.plannedevents[index].name;
                            objTuesday.date = arrData.plannedevents[index].date;
                            objTuesday.type = arrData.plannedevents[index].type;
                            objTuesday.img = arrData.plannedevents[index].img;
                            ;
                            arrWeeks.Tuesday.push(objTuesday);
                        } else if (day == 3) {
                            objWednesday.name = arrData.plannedevents[index].name;
                            objWednesday.date = arrData.plannedevents[index].date;
                            objWednesday.type = arrData.plannedevents[index].type;
                            objWednesday.img = arrData.plannedevents[index].img;
                            arrWeeks.Wednesday.push(objWednesday);
                        } else if (day == 4) {
                            objThursday.name = arrData.plannedevents[index].name;
                            objThursday.date = arrData.plannedevents[index].date;
                            objThursday.type = arrData.plannedevents[index].type;
                            objThursday.img = arrData.plannedevents[index].img;
                            ;
                            arrWeeks.Thursday.push(objThursday);
                        } else if (day == 5) {
                            objFriday.name = arrData.plannedevents[index].name;
                            objFriday.date = arrData.plannedevents[index].date;
                            objFriday.type = arrData.plannedevents[index].type;
                            objFriday.img = arrData.plannedevents[index].img;
                            ;
                            arrWeeks.Friday.push(objFriday);
                        }
                    }
                }
            }
            return arrWeeks;
        }
        
        fn.renderWeeks = function (dtStartDate, dtEndDate) {
            /*    var dtStartDateValue = fn.setYYYYMMDD(dtStartDate);
                var dtEndDateValue = fn.setYYYYMMDD(dtEndDate);*/
            var objWeeks = {};
            var dtStartDateValue = format.parse({
                value: dtStartDate,
                type: format.Type.DATE
            });
            var dtEndDateValue = format.parse({
                value: dtEndDate,
                type: format.Type.DATE
            });
            var arr = [];
            var dt = format.parse({
                value: dtStartDateValue,
                type: format.Type.DATE
            });
            while (dt <= dtEndDateValue) {
                arr.push(new Date(dt));
                dt.setDate(dt.getDate() + 1);
            }
            
            for (var index = 0; index < arr.length; index++) {
                arr[index] = fn.setDateToMonDate(arr[index]);
            }
            objWeeks.Monday = arr[0];
            objWeeks.Tuesday = arr[1];
            objWeeks.Wednesday = arr[2];
            objWeeks.Thursday = arr[3];
            objWeeks.Friday = arr[4];
            return objWeeks;
        }
        
        fn.renderWeeksByDateMonthYear = function (dtStartDate, dtEndDate) {
            /*    var dtStartDateValue = fn.setYYYYMMDD(dtStartDate);
                var dtEndDateValue = fn.setYYYYMMDD(dtEndDate);*/
            var objWeeks = {};
            var dtStartDateValue = format.parse({
                value: dtStartDate,
                type: format.Type.DATE
            });
            var dtEndDateValue = format.parse({
                value: dtEndDate,
                type: format.Type.DATE
            });
            var arr = [];
            var dt = format.parse({
                value: dtStartDateValue,
                type: format.Type.DATE
            });
            while (dt <= dtEndDateValue) {
                arr.push(new Date(dt));
                dt.setDate(dt.getDate() + 1);
            }
            
            for (var index = 0; index < arr.length; index++) {
                arr[index] = fn.setDateToMonDateMonthYear(arr[index]);
            }
            log.debug("arr", arr);
            objWeeks.Monday = arr[0];
            objWeeks.Tuesday = arr[1];
            objWeeks.Wednesday = arr[2];
            objWeeks.Thursday = arr[3];
            objWeeks.Friday = arr[4];
            
            log.debug("objWeeks", objWeeks);
            return objWeeks;
        }
        
        fn.tableBuilder = function (day, dtDate, stRowValues, stType) {
            var stRows = "";
            try {
                
                stRows += ' <td>';
                if (stType == "non-working") {
                    stRows += '<table align="left" style=" border-collapse:collapse;  border:1px solid grey; width: 190px;  height: 350px;  background-color: #f0fcf3;">\n';
                } else {
                    stRows += '<table align="left" style=" border-collapse:collapse;  border:1px solid grey; width: 190px;  height: 350px; ">\n';
                }
                stRows += '<tr style="height: 30px;">\n';
                stRows += '<th style="color:white; background:#151313; font-size: 12px; height: 40px; width: 190px; border:1px solid grey; padding-left: 10px;  vertical-align: middle;">\n';
                stRows += day + '<br/>' + dtDate + '<br/>';
                stRows += '</th>\n';
                stRows += '</tr>\n';
                stRows += stRowValues
                stRows += '</table>\n';
                stRows += '</td>';
            } catch (e) {
                log.debug("error:", e);
            }
            return stRows;
        }
        
        fn.ArrayChecker = function (arrDate) {
            return arrDate === undefined || arrDate.length == 0
        }
        fn.TDBuilder = function (name, img) {
            var stTd = "";
            try {
                name = name != "" ? name : "";
                stTd += '<tr style="height: 20px;">';
                stTd += '<td style="font-size: 10px; vertical-align: top;">';
                stTd += '<table>';
                stTd += '<tr>';
                if (img) {
                    stTd += '<td style="padding-right: 10px; padding-left: 10px;">';
                    stTd += '<img src="' + img + '" style="height: 12px; width:12px;"/>';
                    stTd += '</td>';
                }
                stTd += '<td>';
                stTd += name;
                stTd += '</td>\n';
                stTd += '</tr>\n';
                stTd += '</table>';
                stTd += '</td>';
                stTd += '</tr>\n';
                
            } catch (e) {
                log.debug("error:", e);
            }
            return stTd;
        }
        
        fn.tablesix = function () {
            var stValue = "";
            try {
                stValue += ' <td>';
                stValue += '<table align="left"  style="border-collapse:collapse; height: 350px;"  width="186px">\n';
                stValue += '<tr style="height: 40px;">\n';
                stValue += '<th style="padding-left: 10px; alignment: center;">' + '<br/>' + '&nbsp;&nbsp;LEGEND';
                stValue += '</th>';
                stValue += '</tr>\n';
                
                stValue += '<tr style="height: 20px;">\n';
                stValue += '<td style="font-size: 8px">';
                
                stValue += '<table>';
                stValue += '<tr style="height: 20px;">';
                stValue += '<td style="padding-right: 10px; padding-left: 10px;">';
                stValue += '<img height="12px" width="12px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=82993&amp;c=3688201&amp;h=105971562aaee2d72f15&amp;fcts=20200901004302&amp;whence=" />';
                stValue += '</td>';
                stValue += '<td>';
                stValue += 'NON-WORKING HOLIDAY';
                stValue += '</td>';
                stValue += '</tr>\n';
                stValue += '</table>';
                
                
                stValue += '</td>\n';
                stValue += '</tr>\n';
                
                stValue += '<tr style="height: 20px;">\n';
                stValue += '<td style="font-size: 8px">\n';
                
                stValue += '<table>';
                stValue += '<tr>';
                stValue += '<td style="padding-right: 10px; padding-left: 10px;">';
                stValue += '<img height="12px" width="12px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=84297&amp;c=3688201&amp;h=34c3138a8e2784c3026d&amp;fcts=20200901004232&amp;whence=" />';
                stValue += '</td>';
                stValue += '<td>';
                stValue += 'PLANNED TASK';
                stValue += '</td>';
                stValue += '</tr>\n';
                stValue += '</table>';
                
                stValue += '</td>\n';
                stValue += '</tr>\n';
                
                stValue += '<tr style="height: 20px;">\n';
                stValue += '<td style="font-size: 8px">';
                
                stValue += '<table>';
                stValue += '<tr>';
                stValue += '<td style="padding-right: 10px; padding-left: 10px;">';
                stValue += '<img height="12px" width="12px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=" />';
                stValue += '</td>';
                stValue += '<td>';
                stValue += 'PTO FOR YOU AND YOUR TEAM';
                stValue += '</td>';
                stValue += '</tr>\n';
                stValue += '</table>';
                
                stValue += '</td>\n';
                stValue += '</tr>\n';
                
                stValue += '<tr style="height: 20px;">\n';
                stValue += '<td style="font-size: 8px">\n';
                
                stValue += '<table>';
                stValue += '<tr>';
                stValue += '<td style="padding-right: 10px; padding-left: 10px;">';
                stValue += '<img height="12px" width="12px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=84299&amp;c=3688201&amp;h=7ac0f009f1d802935cb3&amp;fcts=20200901004242&amp;whence=" />';
                stValue += '</td>';
                stValue += '<td>';
                stValue += 'IMPORTANT COMPANY EVENT';
                stValue += '</td>';
                stValue += '</tr>\n';
                stValue += '</table>';
                
                stValue += '</td>\n';
                stValue += '</tr>\n';
                
                stValue += '<tr style="height: 20px;">\n';
                stValue += '<td style="font-size: 8px">\n';
                
                stValue += '<table>';
                stValue += '<tr>';
                stValue += '<td style="padding-right: 10px; padding-left: 10px;">';
                stValue += '<img height="12px" width="12px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=91967&amp;c=3688201&amp;h=f7e7d62c81ca679946df&amp;fcts=20200930202604&amp;whence=" />';
                stValue += '</td>';
                stValue += '<td>';
                stValue += 'OFFICIAL NON WORKING HOLIDAY';
                stValue += '</td>';
                stValue += '</tr>\n';
                stValue += '</table>';
                
                stValue += '</td>\n';
                stValue += '</tr>\n';
                
                stValue += '</table>\n';
                stValue += '</td>';
                
            } catch (e) {
                log.debug("error:", e);
            }
            return stValue;
        }
        
        fn.buildPDFTemplate = function (objData, dtRenderWeeks) {
            var stRowsMon = "";
            var stRowsTue = "";
            var stRowsWed = "";
            var stRowsThu = "";
            var stRowsFri = "";
            var xmlString = "";
            var dtDate = "";
            try {
                
                if (objData.Monday) {
                    dtDate = "";
                    var stType = "";
                    for (var index = 0; index < objData.Monday.length; index++) {
                        /*  log.debug("Monday iteration...", objData.Monday[index]);*/
                        dtDate = fn.setDateToMonDate(objData.Monday[index].date);
                        stRowsMon += fn.TDBuilder(fn.replaceAmpersand(objData.Monday[index].name), objData.Monday[index].img);
                        if (objData.Monday[index].type == 'non-working') {
                            stType = objData.Monday[index].type;
                        }
                        /* log.debug("Monday iteration stType...", stType);*/
                    }
                    stRowsMon = fn.tableBuilder('Monday', dtRenderWeeks.Monday, stRowsMon, TBTypeChecker(stType));
                    /*log.debug("stRowsMon:", stRowsMon);*/
                    
                }
                
                if (objData.Tuesday) {
                    dtDate = "";
                    var stType = "";
                    for (var index = 0; index < objData.Tuesday.length; index++) {
                        /* log.debug("Tuesday iteration...", objData.Tuesday[index]);*/
                        dtDate = fn.setDateToMonDate(objData.Tuesday[index].date);
                        stRowsTue += fn.TDBuilder(fn.replaceAmpersand(objData.Tuesday[index].name), objData.Tuesday[index].img);
                        if (objData.Tuesday[index].type == "non-working") {
                            stType = objData.Tuesday[index].type;
                        }
                        /*log.debug("Tuesday iteration stType...", stType);*/
                    }
                    stRowsTue = fn.tableBuilder('Tuesday', dtRenderWeeks.Tuesday, stRowsTue, TBTypeChecker(stType));
                    /*log.debug("stRowsTue:", stRowsTue);*/
                }
                
                if (objData.Wednesday) {
                    dtDate = "";
                    var stType = "";
                    for (var index = 0; index < objData.Wednesday.length; index++) {
                        /* log.debug("Wednesday iteration...", objData.Wednesday[index]);*/
                        dtDate = fn.setDateToMonDate(objData.Wednesday[index].date);
                        stRowsWed += fn.TDBuilder(fn.replaceAmpersand(objData.Wednesday[index].name), objData.Wednesday[index].img);
                        if (objData.Wednesday[index].type == 'non-working') {
                            stType = objData.Wednesday[index].type;
                        }
                        /*log.debug("Wednesday iteration stType...", stType);*/
                    }
                    stRowsWed = fn.tableBuilder('Wednesday', dtRenderWeeks.Wednesday, stRowsWed, TBTypeChecker(stType));
                    /* log.debug("stRowsWed:", stRowsWed);*/
                }
                
                if (objData.Thursday) {
                    dtDate = "";
                    var stType = "";
                    for (var index = 0; index < objData.Thursday.length; index++) {
                        /*log.debug("Thursday iteration...", objData.Thursday[index]);*/
                        dtDate = fn.setDateToMonDate(objData.Thursday[index].date);
                        stRowsThu += fn.TDBuilder(fn.replaceAmpersand(objData.Thursday[index].name), objData.Thursday[index].img);
                        if (objData.Thursday[index].type == 'non-working') {
                            stType = objData.Thursday[index].type;
                        }
                        /*log.debug("Thursday iteration stType...", stType);*/
                    }
                    stRowsThu = fn.tableBuilder('Thursday', dtRenderWeeks.Thursday, stRowsThu, TBTypeChecker(stType));
                }
                
                if (objData.Friday) {
                    dtDate = "";
                    var stType = "";
                    for (var index = 0; index < objData.Friday.length; index++) {
                        log.debug("Friday iteration...", objData.Friday[index]);
                        dtDate = fn.setDateToMonDate(objData.Friday[index].date);
                        stRowsFri += fn.TDBuilder(fn.replaceAmpersand(objData.Friday[index].name), objData.Friday[index].img);
                        if (objData.Friday[index].type == 'non-working') {
                            stType = objData.Friday[index].type;
                        }
                        log.debug("Friday iteration stType...", stType);
                    }
                    stRowsFri = fn.tableBuilder('Friday', dtRenderWeeks.Friday, stRowsFri, TBTypeChecker(stType));
                }
                
                var stTableSix = fn.tablesix();
                xmlString += '<tr>' + stRowsMon + stRowsTue + stRowsWed + '</tr>';
                xmlString += '<tr style="padding-top: -7px;">' + stRowsThu + stRowsFri + stTableSix + '</tr>\n';
                /*log.debug("xmlstring:", xmlString);*/
                
            } catch (e) {
                log.debug("error:", e);
            }
            
            return xmlString;
        }
        
        function TBTypeChecker(stType) {
            var type = '';
            if (stType == 'non-working') {
                return stType;
            } else {
                type = 'working';
                return type;
            }
        }
        
        fn.setFY = function (stYear) {
            
            var stYearValue = stYear.toString();
            var stValue = stYearValue.slice(2);
            var added = parseInt(stValue) + 1;
            
            return 'FY' + added;
        }
        fn.setmmddyyyy = function (stDate) {
            try {
                /*         log.debug("stDate:", stDate);*/
                if (stDate) {
                    var dtFormatDate = format.parse({
                        value: stDate,
                        type: format.Type.DATE
                    });
                    
                    var dtMonth = dtFormatDate.getMonth();
                    var dtDate = dtFormatDate.getDate();
                    var dtYear = dtFormatDate.getFullYear();
                    
                    dtDate = fn.prependingZeroDate(dtDate);
                    dtMonth = fn.prependingZeroDate(dtMonth + 1);
                    //dtMonth += 1;
                    /* log.debug("setDateToMonDate:", dtMonth + "/" + dtDate + "/" + dtYear);*/
                    return dtMonth + "/" + dtDate + "/" + dtYear;
                }
            } catch (e) {
                log.error("error:", e);
            }
        }
        
        fn.setYYYYMMDD = function (stDate) {
            try {
                if (stDate) {
                    var dtFormatDate = format.parse({
                        value: stDate,
                        type: format.Type.DATE
                    });
                    
                    var dtMonth = dtFormatDate.getMonth();
                    var dtDate = dtFormatDate.getDate();
                    var dtYear = dtFormatDate.getFullYear();
                    
                    dtDate = fn.prependingZeroDate(dtDate);
                    dtMonth = fn.prependingZeroDate(dtMonth);
                    /* log.debug("setDateToMonDate:", dtYear + "-" + dtMonth + "-" + dtDate);*/
                    return dtYear + "-" + dtMonth + "-" + dtDate;
                }
            } catch (e) {
                log.error("error:", e);
            }
        }
        
        
        fn.prependingZeroDate = function (date) {
            return date > 9 ? "" + date : "0" + date;
        }
        
        fn.setDateToMonDate = function (stDate) {
            /*            log.debug("stDate:", stDate);*/
            var dtFormatDate = format.parse({
                value: stDate,
                type: format.Type.DATE
            });
            
            var month = [];
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sep";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";
            var dtMonth = month[dtFormatDate.getMonth()];
            var dtDate = dtFormatDate.getDate();
            /*        log.debug("dtMonth:", dtMonth);*/
            return dtMonth + " " + dtDate;
        }
        
        fn.setDateToMonDateMonthYear = function (stDate) {
            /*            log.debug("stDate:", stDate);*/
            var dtFormatDate = format.parse({
                value: stDate,
                type: format.Type.DATE
            });
            
            var month = [];
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sep";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";
            var dtMonth = month[dtFormatDate.getMonth()];
            var dtDate = dtFormatDate.getDate();
            var dtYear = dtFormatDate.getFullYear();
            return dtDate + "-" + dtMonth + "-" + dtYear;
        }
        
        fn.monthToday = function () {
            var Today = new Date()
            /*log.debug("Today:", Today);*/
            var month = [];
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sep";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";
            var dtMonth = month[Today.getMonth()]
            /*log.debug("monthtoday:", dtMonth);*/
            return dtMonth;
        }
        
        fn.dateToday = function () {
            var objDate = {};
            var Today = new Date()
            /*log.debug("Today:", Today);*/
            var month = [];
            month[0] = "January";
            month[1] = "February";
            month[2] = "March";
            month[3] = "April";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "July";
            month[7] = "August";
            month[8] = "September";
            month[9] = "October";
            month[10] = "November";
            month[11] = "December";
            var dtMonth = month[Today.getMonth()]
            var dtDate = Today.getDate();
            var dtYear = Today.getFullYear();
            var date = dtMonth + " " + dtDate + "," + ' ' + dtYear;
            var time = Today.getHours() + ":" + Today.getMinutes() + ":" + Today.getSeconds();
            /*log.debug("dateToday:", dtMonth + " " + dtDate + "," + ' ' + dtYear);*/
            
            objDate.date = date;
            objDate.time = time;
            return objDate;
        }
        
        fn.buildTables = function (objResults) {
            var stRows = "";
            var stCombine = "";
            try {
                for (var indexitem = 0; indexitem < objResults.length; indexitem++) {
                    var tablerows = objResults[indexitem];
                    stRows = "";
                    for (var index in tablerows) {
                        stRows += '<td colspan="1"  data-b-a-s="medium">' + tablerows[index] + "</td>\n";
                    }
                    stCombine += "<tr>\n" + stRows + "        </tr>";
                }
            } catch (e) {
                log.debug("buildTables", e);
            }
            
            return stCombine;
        }
        
        
        fn.getRequestTimeOff = function (objFBWorkchatAppConfig) {
            var arrResults = [];
            var searchRTO = search.load({
                id: objFBWorkchatAppConfig.savedsearch
            });
            
            var myPagedData = searchRTO.runPaged({
                pageSize: 1000
            });
            
            try {
                myPagedData.pageRanges.forEach(function (pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        var objRequestTimeOff = {};
                        objRequestTimeOff.type = objFBWorkchatAppConfig.type;
                        objRequestTimeOff.message = objFBWorkchatAppConfig.message;
                        objRequestTimeOff.config = objFBWorkchatAppConfig.config;
                        objRequestTimeOff.recipient = result.getValue({
                            name: 'custrecord_tot_timeoffreq_approver',
                            summary: search.Summary.GROUP
                        });
                        
                        objRequestTimeOff.recipientname = result.getText({
                            name: 'custrecord_tot_timeoffreq_approver',
                            summary: search.Summary.GROUP
                        });
                        
                        objRequestTimeOff.count = result.getValue({
                            name: 'internalid',
                            summary: search.Summary.COUNT
                        });
                        arrResults.push(objRequestTimeOff);
                    });
                });
            } catch (e) {
                log.debug(e);
            }
            
            return arrResults;
        }
        
        fn.getTimeEntries = function (objFBWorkchatAppConfig) {
            var arrResults = [];
            var searchTE = search.load({
                id: objFBWorkchatAppConfig.savedsearch
            });
            
            var myPagedData = searchTE.runPaged({
                pageSize: 1000
            });
            
            try {
                myPagedData.pageRanges.forEach(function (pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        var objTimeEntries = {};
                        objTimeEntries.type = objFBWorkchatAppConfig.type;
                        objTimeEntries.message = objFBWorkchatAppConfig.message;
                        objTimeEntries.config = objFBWorkchatAppConfig.config;
                        objTimeEntries.recipient = result.getValue({
                            name: 'projectmanager',
                            join: 'job',
                            summary: search.Summary.GROUP
                        });
                        
                        objTimeEntries.recipientname = result.getText({
                            name: 'projectmanager',
                            join: 'job',
                            summary: search.Summary.GROUP
                        });
                        
                        objTimeEntries.count = result.getValue({
                            name: 'internalid',
                            summary: search.Summary.COUNT
                        });
                        arrResults.push(objTimeEntries);
                    });
                });
            } catch (e) {
                log.debug(e);
            }
            
            return arrResults;
        }
        
        fn.getIncompleteTimeSheet = function (objFBWorkchatAppConfig) {
            var arrResults = [];
            var searchICTS = search.load({
                id: objFBWorkchatAppConfig.savedsearch
            });
            
            var myPagedData = searchICTS.runPaged({
                pageSize: 1000
            });
            
            try {
                myPagedData.pageRanges.forEach(function (pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        var objIncompleteTimeSheet = {};
                        objIncompleteTimeSheet.type = objFBWorkchatAppConfig.type;
                        objIncompleteTimeSheet.message = objFBWorkchatAppConfig.message;
                        objIncompleteTimeSheet.config = objFBWorkchatAppConfig.config;
                        objIncompleteTimeSheet.recipient = result.getValue({
                            name: 'employee',
                            summary: search.Summary.GROUP
                        });
                        
                        objIncompleteTimeSheet.recipientname = result.getText({
                            name: 'employee',
                            summary: search.Summary.GROUP
                        });
                        
                        objIncompleteTimeSheet.count = result.getValue({
                            name: 'enddate',
                            summary: search.Summary.COUNT
                        });
                        arrResults.push(objIncompleteTimeSheet);
                    });
                });
            } catch (e) {
                log.debug(e);
            }
            
            return arrResults;
        }
        
        fn.getWorKPlaceIdByEmployee = function (stEmployeeId) {
            var stWPId = null;
            try {
                var recEmployee = record.load({
                    type: record.Type.EMPLOYEE,
                    id: stEmployeeId
                });
                
                stWPId = recEmployee.getValue('custentity_workplace_id');
                
            } catch (e) {
                log.debug('getWorKPlaceIdByEmployee', e);
            }
            return stWPId;
        }
        
        fn.buildEventTableRows = function (arrData) {
            var strHTML = '';
            for (var indx = 0; indx < arrData.length; indx++) {
                strHTML += '<tr style="border: 1px solid #f5f5f5;">';
                strHTML += '<td>' + arrData[indx].date + '</td>';
                strHTML += '<td>' + arrData[indx].name + '</td>';
                strHTML += '</tr>';
            }
            return strHTML;
        }
        
        fn.buildPlannedEventTableRows = function (arrData) {
            var strHTML = '';
            var count = 0;
            for (var indx = 0; indx < arrData.length; indx++) {
                if (count == 23) {
                    //strHTML += '<pbr size="A4-landscape"/>';
                    count = 0;
                }
                strHTML += '<tr style="border: 1px solid #f5f5f5;">';
                strHTML += '<td width="25%">' + arrData[indx].date + '</td>';
                strHTML += '<td width="50%"> ' + arrData[indx].name + '</td>';
                strHTML += '<td width="25%">' + arrData[indx].durations + '</td>';
                strHTML += '</tr>';
                count++;
                
            }
            return strHTML;
        }
        
        fn.nullChecker = function (str, st) {
            var whitespace = "";
            log.debug("str" + " " + st, str);
            if (!stringChecker(str)) {
                log.debug("value" + " " + st, str);
                return str;
            } else {
                return whitespace;
            }
        }
        
        fn.firstDayAndLastDayOfTheWeek = function (stEmployee) {
            var objLocation = fn.getEmployeeLocationTimeZone(stEmployee);
            var dtThisMonth = fn.getMonthFirstEndDate(objLocation.timezone);
            return dtThisMonth;
        }
    
        fn.getPDFObjectRecord = function (stEmployee, stSearchId) {
            var objResults = {};
            var objLocation = fn.getEmployeeLocationTimeZone(stEmployee);
            var dtThisMonth = fn.getMonthFirstEndDate(objLocation.timezone);
            log.debug("dtThisMonth", dtThisMonth);
            log.debug('objLocation', objLocation);
            try {
                objResults.month = fn.convertToMonth[dtThisMonth.firstDay.getMonth()];
                objResults.importantevents = fn.getImportantEvents(stEmployee, stSearchId, dtThisMonth.firstDay.getMonth(), objLocation.id, objLocation.timezone, dtThisMonth.firstDayOfWeekText, dtThisMonth.lastDayOfWeekText);
                log.debug('objResults.importantevents', objResults.importantevents);
                objResults.plannedevents = fn.getPlannedEvents(stEmployee, dtThisMonth.firstDayOfWeekText, dtThisMonth.lastDayOfWeekText);
                log.debug('objResults.plannedevents', objResults.plannedevents);
                objResults.nextWeekSummary = fn.nextWeekSummary(stEmployee, stSearchId, dtThisMonth, objLocation);
                objResults.thisWeekSummary = fn.thisWeekSummary(stEmployee, stSearchId, dtThisMonth, objLocation);
            } catch (e) {
                log.debug('getPDFObjectRecord', e);
            }
            log.debug("getPDFObjectRecord:", objResults);
            return objResults;
        }
        
        fn.getPlannedEvents = function (stEmployeem, stStartDate, stEndDate) {
            var arrEvents = [];
            try {
                var arrReqTime = fn.getRequestTimeOffEvents(stEmployeem, stStartDate, stEndDate);
                log.debug('arrReqTime', arrReqTime);
                arrEvents = fn.includeArrays(arrEvents, arrReqTime);
                var arrResAlloc = fn.getResourceAllocation(stEmployeem, stStartDate, stEndDate);
                log.debug('arrResAlloc', arrResAlloc);
                arrEvents = fn.includeArrays(arrEvents, arrResAlloc);
                //SORT ALL INDEX BY DATE
                arrEvents = fn.sortArrayObjectByDate(arrEvents);
            } catch (e) {
                log.debug('getPlannedEvents', e);
            }
            return arrEvents;
        }
        
        fn.getImportantEvents = function (stEmployee, stSearchId, stThisMonth, stLocation, stLocationTimeZone, stStartDate, stEndDate) {
            var arrImportantEvents = [];
            log.debug("stLocation", stLocation);
            try {
                var arrTraction = fn.getTractionEvents(stSearchId, stLocation, stLocationTimeZone, stStartDate, stEndDate);
                log.debug("arrTraction", arrTraction);
                arrImportantEvents = fn.includeArrays(arrImportantEvents, arrTraction);
                var arrHolidays = fn.getNonWorkingHolidaysEvents(stEmployee, stThisMonth);
                arrImportantEvents = fn.includeArrays(arrImportantEvents, arrHolidays);
                var getAllNonHoliday = fn.getAllNonWorkingHolidaysEvents(stEmployee, stThisMonth);
                arrImportantEvents = fn.includeArrays(arrImportantEvents, getAllNonHoliday);
                log.debug("getAllHoliday", getAllNonHoliday);
                //SORT ALL INDEX BY DATE
                arrImportantEvents = fn.sortArrayObjectByDate(arrImportantEvents);
                log.debug("arrImportantEvents", arrImportantEvents);
            } catch (e) {
                log.debug('getImportantEvents', e);
            }
            return arrImportantEvents;
        }
        
        fn.getTractionEvents = function (stSearchId, stLocation, stLocationTimeZone, stStartDate, stEndDate) {
            var arrResults = [];
            try {
                var searchObj = search.load({
                    id: stSearchId
                });
                var arrFilters = [];
                arrFilters.push("AND");
                arrFilters.push(["custrecord_sr_event_date", "within", stStartDate, stEndDate]);
                arrFilters.push("AND");
                arrFilters.push(["custrecord_sr_event_location", "anyof", stLocation]);
                
                
                searchObj.filterExpression = searchObj.filterExpression.concat(arrFilters);
                searchObj.run().each(function (result) {
                    var objResult = {};
                    objResult.name = result.getValue('name');
                    objResult.date = convertDateByTimeZone(result.getValue('custrecord_sr_event_date'), result.getValue('custrecord_sr_event_timezone'), stLocationTimeZone, result.getValue('custrecord_sr_event_time'));
                    objResult.location = result.getValue('custrecord_sr_event_location');
                    objResult.class = result.getValue('custrecord_sr_event_class');
                    objResult.time = result.getValue('custrecord_sr_event_time');
                    objResult.timezone = result.getValue('custrecord_sr_event_timezone');
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84299&amp;c=3688201&amp;h=7ac0f009f1d802935cb3&amp;fcts=20200901004242&amp;whence=";
                    arrResults.push(objResult);
                    return true;
                });
            } catch (e) {
                log.debug('getTractionEvents', e);
            }
            return arrResults;
        }
        
        fn.getAllPTO = function (stStartDate, stEndDate, stEmployee) {
            var arrMonday = [], arrTuesday = [], arrWednesday = [], arrThursday = [], arrFriday = [];
            var arrPTO = [];
            var objFinalDateResult = {};
            var objWeekDates = {};
            var objRenderWeeks = fn.renderWeeksByDateMonthYear(stStartDate, stEndDate);
            try {
                var timeoffrequestSearchObj = search.create({
                    type: "timeoffrequest",
                    filters:
                        [
                            ["approvalstatus", "anyof", "8"],
                            "AND",
                            ["timeoffrequestdetail.timeofftype", "anyof", "1"],
                            "AND",
                            ["startdate", "onorafter", stStartDate],
                            "AND",
                            ["enddate", "onorbefore", stEndDate]
                        ],
                    columns:
                        [
                            search.createColumn({name: "timeofftype", label: "Time-Off Types", summary: "GROUP"}),
                            search.createColumn({
                                name: "entityid",
                                join: "employee",
                                label: "Name",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "internalid",
                                join: "employee",
                                label: "Internal ID",
                                summary: "GROUP"
                            }),
                            search.createColumn({name: "startdate", label: "Start Date", summary: "GROUP"}),
                            search.createColumn({name: "enddate", label: "End Date", summary: "GROUP"}),
                        ]
                });
                var searchResultCount = timeoffrequestSearchObj.runPaged().count;
                log.debug("timeoffrequestSearchObj result count", searchResultCount);
                timeoffrequestSearchObj.run().each(function (result) {
                    var objPTODates = {};
                    var objPTO = {};
                    objPTO.intPTOId = result.getValue({
                        name: "internalid",
                        join: "employee",
                        summary: "GROUP"
                    });
                    objPTO.stPTOName = result.getValue({
                        name: "entityid",
                        join: "employee",
                        summary: "GROUP"
                    });
                    
                    var stDescription = result.getValue({
                        name: "timeofftype",
                        summary: "GROUP"
                    });
                    
                    var dtStartDateValue = result.getValue({
                        name: "startdate",
                        summary: "GROUP"
                    });
                    log.debug("dtStartDateValue", dtStartDateValue);
                    if (objRenderWeeks.Monday == dtStartDateValue) {
                        if (objPTO.intPTOId) {
                            objPTODates[objPTO.intPTOId] = {};
                            objPTODates[objPTO.intPTOId].name = objPTO.stPTOName;
                            objPTODates[objPTO.intPTOId].date = dtStartDateValue;
                            objPTODates[objPTO.intPTOId].description = stDescription;
                            arrMonday.push(objPTODates);
                        }
                    } else if (objRenderWeeks.Tuesday == dtStartDateValue) {
                        if (objPTO.intPTOId) {
                            objPTODates[objPTO.intPTOId] = {};
                            objPTODates[objPTO.intPTOId].name = objPTO.stPTOName;
                            objPTODates[objPTO.intPTOId].date = dtStartDateValue;
                            objPTODates[objPTO.intPTOId].description = stDescription;
                            arrTuesday.push(objPTODates);
                        }
                    } else if (objRenderWeeks.Wednesday == dtStartDateValue) {
                        if (objPTO.intPTOId) {
                            objPTODates[objPTO.intPTOId] = {};
                            objPTODates[objPTO.intPTOId].name = objPTO.stPTOName;
                            objPTODates[objPTO.intPTOId].date = dtStartDateValue;
                            objPTODates[objPTO.intPTOId].description = stDescription;
                            arrWednesday.push(objPTODates);
                        }
                    } else if (objRenderWeeks.Thursday == dtStartDateValue) {
                        if (objPTO.intPTOId) {
                            objPTODates[objPTO.intPTOId] = {};
                            objPTODates[objPTO.intPTOId].name = objPTO.stPTOName;
                            objPTODates[objPTO.intPTOId].date = dtStartDateValue;
                            objPTODates[objPTO.intPTOId].description = stDescription;
                            arrThursday.push(objPTODates);
                        }
                    } else if (objRenderWeeks.Friday == dtStartDateValue) {
                        if (objPTO.intPTOId) {
                            objPTODates[objPTO.intPTOId] = {};
                            objPTODates[objPTO.intPTOId].name = objPTO.stPTOName;
                            objPTODates[objPTO.intPTOId].date = dtStartDateValue;
                            objPTODates[objPTO.intPTOId].description = stDescription;
                            arrFriday.push(objPTODates);
                        }
                    }
                    return true;
                });
                
                var Monday = (arrMonday.length > 0) ? arrMonday : [];
                objFinalDateResult.Monday = Monday;
                
                var Tuesday = (arrTuesday.length > 0) ? arrTuesday : [];
                objFinalDateResult.Tuesday = Tuesday;
                
                var Wednesday = (arrWednesday.length > 0) ? arrWednesday : [];
                objFinalDateResult.Wednesday = Wednesday;
                
                var Thursday = (arrThursday.length > 0) ? arrThursday : [];
                objFinalDateResult.Thursday = Thursday;
                
                var Friday = (arrFriday.length > 0) ? arrFriday : [];
                objFinalDateResult.Friday = Friday;
                
                log.debug("objFinalDateResult", objFinalDateResult);
                return objFinalDateResult;
            } catch (e) {
                log.debug("exception:", e);
            }
        }
        
        fn.getSubordinates = function (stEmployee, stStartDate, stEndDate) {
            var arrMonday = [], arrTuesday = [], arrWednesday = [], arrThursday = [], arrFriday = []; /*Array*/
            var objMonday = {}, objTuesday = {}, objWednesday = {}, objThursday = {}, objFriday = {}; /*Objects*/
            var objWeekResults = {};
            var dtMonday, dtTuesday, dtWednesday, dtThursday, dtFriday;
            var stDescriptionMonday, stDescriptionTuesday, stDescriptionWednesday, stDescriptionThursday,
                stDescriptionFriday;
            try {
                var arrSubordinates = [];
                var stSupervisorId;
                
                /*Load Employee Subordinates*/
                if (stEmployee) {
                    var objEmployee = record.load({
                        type: record.Type.EMPLOYEE,
                        id: stEmployee
                    });
                    var currentSubordinatesCount = objEmployee.getLineCount({
                        'sublistId': 'subordinates'
                    });
                    
                    stSupervisorId = objEmployee.getValue({
                        fieldId: "supervisor"
                    });
                    var stSupervisorName = objEmployee.getText({
                        fieldId: "supervisor"
                    });
                    
                    if (currentSubordinatesCount > 0) {
                        for (var index = 0; index < currentSubordinatesCount; index++) {
                            var objSubordinateList = {};
                            objSubordinateList.id = objEmployee.getSublistValue({
                                sublistId: 'subordinates',
                                fieldId: 'internalid',
                                line: index
                            });
                            arrSubordinates.push(objSubordinateList.id);
                        }
                        log.debug("arrSubordinates", arrSubordinates);
                    }
                }
                
                /*Load Supervisor Subordinates*/
                if (stSupervisorId) {
                    arrSubordinates.push(stSupervisorId);
                    var objEmployeeSupervisor = record.load({
                        type: record.Type.EMPLOYEE,
                        id: stSupervisorId
                    });
                    var currentSubordinatesSupervisorCount = objEmployeeSupervisor.getLineCount({
                        'sublistId': 'subordinates'
                    });
                    
                    if (currentSubordinatesSupervisorCount > 0) {
                        for (var index = 0; index < currentSubordinatesSupervisorCount; index++) {
                            var objSubordinateList = {};
                            objSubordinateList.id = objEmployeeSupervisor.getSublistValue({
                                sublistId: 'subordinates',
                                fieldId: 'internalid',
                                line: index
                            });
                            arrSubordinates.push(objSubordinateList.id);
                        }
                        log.debug("arrSubordinates", arrSubordinates);
                    }
                }
                
                /*Load All Employee has a PTO*/
                var objSubordinates = fn.getAllPTO(stStartDate, stEndDate, stEmployee);
                
                if (fn.arrayIdChecker(arrSubordinates, stEmployee) == false) {
                    arrSubordinates.push(stEmployee);
                }
                /*Consolidate All the Employee that subordinates and Team member of this employee*/
                if (arrSubordinates.length > 0) {
                    for (var index = 0; index < arrSubordinates.length; index++) {
                        /*Monday*/
                        for (var row = 0; row < objSubordinates.Monday.length; row++) {
                            if (objSubordinates.Monday[row][arrSubordinates[index]]) {
                                stDescriptionMonday = objSubordinates.Monday[row][arrSubordinates[index]].description;
                                dtMonday = objSubordinates.Monday[row][arrSubordinates[index]].date;
                                arrMonday.push(objSubordinates.Monday[row][arrSubordinates[index]].name);
                            }
                        }
                        /*Tuesday*/
                        for (var row = 0; row < objSubordinates.Tuesday.length; row++) {
                            if (objSubordinates.Tuesday[row][arrSubordinates[index]]) {
                                stDescriptionTuesday = objSubordinates.Tuesday[row][arrSubordinates[index]].description;
                                dtTuesday = objSubordinates.Tuesday[row][arrSubordinates[index]].date;
                                arrTuesday.push(objSubordinates.Tuesday[row][arrSubordinates[index]].name);
                            }
                        }
                        /*Wednesday*/
                        for (var row = 0; row < objSubordinates.Wednesday.length; row++) {
                            if (objSubordinates.Wednesday[row][arrSubordinates[index]]) {
                                stDescriptionWednesday = objSubordinates.Wednesday[row][arrSubordinates[index]].description;
                                dtWednesday = objSubordinates.Wednesday[row][arrSubordinates[index]].date;
                                arrWednesday.push(objSubordinates.Wednesday[row][arrSubordinates[index]].name);
                            }
                        }
                        /*Thursday*/
                        for (var row = 0; row < objSubordinates.Thursday.length; row++) {
                            if (objSubordinates.Thursday[row][arrSubordinates[index]]) {
                                stDescriptionThursday = objSubordinates.Thursday[row][arrSubordinates[index]].description;
                                dtThursday = objSubordinates.Thursday[row][arrSubordinates[index]].date;
                                arrThursday.push(objSubordinates.Thursday[row][arrSubordinates[index]].name);
                            }
                        }
                        /*Friday*/
                        for (var row = 0; row < objSubordinates.Friday.length; row++) {
                            if (objSubordinates.Friday[row][arrSubordinates[index]]) {
                                stDescriptionFriday = objSubordinates.Friday[row][arrSubordinates[index]].description;
                                dtFriday = objSubordinates.Friday[row][arrSubordinates[index]].date;
                                arrFriday.push(objSubordinates.Friday[row][arrSubordinates[index]].name);
                            }
                        }
                    }
                }
                
                if (arrMonday.length > 0) {
                    objMonday.date = dtMonday;
                    objMonday.description = stDescriptionMonday;
                    objMonday.name = arrMonday;
                }
                
                if (arrTuesday.length > 0) {
                    objTuesday.date = dtTuesday;
                    objTuesday.description = stDescriptionTuesday;
                    objTuesday.name = arrTuesday;
                }
                
                if (arrWednesday.length > 0) {
                    objWednesday.date = dtWednesday;
                    objWednesday.description = stDescriptionWednesday;
                    objWednesday.name = arrWednesday;
                }
                
                if (arrThursday.length > 0) {
                    objThursday.date = dtThursday;
                    objThursday.description = stDescriptionThursday;
                    objThursday.name = arrThursday;
                }
                
                if (arrFriday.length > 0) {
                    objFriday.date = dtFriday;
                    objFriday.description = stDescriptionFriday;
                    objFriday.name = arrFriday;
                }
                
                objWeekResults.Monday = objMonday;
                objWeekResults.Tuesday = objTuesday;
                objWeekResults.Wednesday = objWednesday;
                objWeekResults.Thursday = objThursday;
                objWeekResults.Friday = objFriday;
                return objWeekResults;
            } catch (e) {
                log.debug("getSubordinates exception:", e);
            }
        }
        
        fn.arrayIdChecker = function (arr, id) {
            if (arr.indexOf(id) !== -1) {
                return true;
            } else {
                return false;
            }
        }
        
        fn.getNonWorkingHolidaysEvents = function (stEmployee, stThisMonth) {
            try {
                
                var today = new Date();
                var arrExecptionDays = [];
                var recEmployee = record.load({
                    type: 'employee',
                    id: stEmployee
                });
                var workCalendarId = recEmployee.getValue('workcalendar');
                if (workCalendarId) {
                    var recWorkCalendar = record.load({
                        type: 'workcalendar',
                        id: workCalendarId,
                        isDynamic: true
                    });
                    var dtToday = new Date();
                    var dtSixtyDays = addDates(new Date(), 60);
                    var lineCount = recWorkCalendar.getLineCount('workcalendarexception');
                    if (lineCount > 0) {
                        for (var indx = 0; indx < lineCount; indx++) {
                            
                            var excepDate = recWorkCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'exceptiondate',
                                line: indx
                            });
                            
                            
                            var holidayName = recWorkCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'description',
                                line: indx
                            });
                            
                            //GET THE HOLIDAY ONCE THE DATE BETWEEN TODAY TO 60 DAY FROM TODAY
                            //log.debug('dates','excepDate=>'+excepDate + '<br/> dtToday=>'+dtToday+ '<br/> dtSixtyDays=>'+dtSixtyDays);
                            if (excepDate.getTime() <= dtSixtyDays.getTime() && excepDate.getTime() >= dtToday.getTime()) {
                                var objException = {};
                                objException.name = holidayName;
                                objException.date = recWorkCalendar.getSublistText({
                                    sublistId: 'workcalendarexception',
                                    fieldId: 'exceptiondate',
                                    line: indx
                                });
                                objException.location = '';
                                objException.class = '';
                                objException.time = '';
                                objException.timezone = '';
                                objException.type = "non-working";
                                objException.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=91967&amp;c=3688201&amp;h=f7e7d62c81ca679946df&amp;fcts=20200930202604&amp;whence=";
                                arrExecptionDays.push(objException);
                            }
                        }
                    }
                    
                }
                
                //GET ALL HOLIDAYS WITH A MONTH
                
                
            } catch (e) {
                log.debug('getNonWorkingHolidaysEvents', e);
            }
            return arrExecptionDays;
        }
        
        fn.getAllNonWorkingHolidaysEvents = function (stEmployee, stThisMonth) {
            try {
                var arrExecptionDays = [];
                var recEmployee = record.load({
                    type: 'employee',
                    id: stEmployee
                });
                var workCalendarId = recEmployee.getValue('workcalendar');
                
                log.debug("recEmployee", recEmployee);
                log.debug("workCalendarId", workCalendarId);
                if (workCalendarId) {
                    var dtToday = new Date();
                    var dtSixtyDays = addDates(new Date(), 60);
                    var workcalendarSearchObj = search.create({
                        type: "workcalendar",
                        filters:
                            [
                                ["internalid", "noneof", workCalendarId]
                            ],
                        columns:
                            [
                                search.createColumn({name: "exceptiondate", label: "Exception Date"}),
                                search.createColumn({name: "exceptiondescription", label: "Exception Description"}),
                                search.createColumn({name: "comments", label: "Comment"}),
                                search.createColumn({
                                    name: "name",
                                    sort: search.Sort.ASC,
                                    label: "Name"
                                })
                            ]
                    });
                    var searchResultCount = workcalendarSearchObj.runPaged().count;
                    log.debug("workcalendarSearchObj result count", searchResultCount);
                    workcalendarSearchObj.run().each(function (result) {
                        var exceptDate = result.getValue({
                            name: 'exceptiondate'
                        });
                        
                        var holidayName = result.getValue({
                            name: 'exceptiondescription'
                        });
                        
                        var countryName = result.getValue({
                            name: 'name'
                        })
                        
                        var stComments = result.getValue({
                            name: 'comments'
                        });
                        
                        var objException = {};
                        objException.name = holidayName + " (" + stComments + ")";
                        objException.date = result.getValue({
                            name: 'exceptiondate'
                        });
                        objException.location = '';
                        objException.class = '';
                        objException.time = '';
                        objException.timezone = '';
                        objException.type = "working";
                        objException.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=91967&amp;c=3688201&amp;h=f7e7d62c81ca679946df&amp;fcts=20200930202604&amp;whence=";
                        arrExecptionDays.push(objException);
                        
                        
                        return true;
                    });
                    
                }
                
            } catch (e) {
                log.debug('getAllNonWorkingHolidaysEvents', e);
            }
            return arrExecptionDays;
        }
        
        fn.getResourceAllocation = function (stEmployee, stStartDate, stEndDate) {
            var arrResAlloc = [];
            try {
                var timebillSearchObj = search.create({
                    type: "timebill",
                    filters:
                        [
                            ["type", "anyof", "B"],
                            "AND",
                            ["employee", "anyof", stEmployee],
                            "AND",
                            ["date", "within", stStartDate, stEndDate]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "date",
                                summary: "GROUP",
                                sort: search.Sort.ASC
                            }),
                            search.createColumn({
                                name: "customer",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "hours",
                                summary: "COUNT"
                            }),
                            search.createColumn({
                                name: "durationdecimal",
                                summary: "SUM"
                            })
                        ]
                });
                timebillSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                    var objResult = {};
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84297&amp;c=3688201&amp;h=34c3138a8e2784c3026d&amp;fcts=20200901004232&amp;whence=";
                    objResult.name = result.getText({
                        name: "customer",
                        summary: "GROUP"
                    });
                    objResult.date = result.getValue({
                        name: "date",
                        summary: "GROUP"
                    });
                    objResult.customer = result.getText({
                        name: "customer",
                        summary: "GROUP"
                    });
                    var dur = result.getValue({
                        name: "durationdecimal",
                        summary: "SUM"
                    });
                    objResult.durations = decToMin(Number(dur).toFixed(2))
                    arrResAlloc.push(objResult);
                    return true;
                });
                
            } catch (e) {
                log.debug('getResourceAllocation', e);
            }
            return arrResAlloc;
        }
        
        fn.getRequestTimeOffEvents = function (stEmployee, stStartDate, stEndDate) {
            try {
                log.debug("start getRequestTimeOffEvents");
                var arrResults = [];
                var objSubordinatesListFinalResults = fn.getSubordinates(stEmployee, stStartDate, stEndDate);
                var stEmployeeName = fn.searchEmployeeName(stEmployee);
                log.debug("objsubordinateslistfinalresults", objSubordinatesListFinalResults);
                if (!fn.objectIsempty(objSubordinatesListFinalResults.Monday)) {
                    var stValue = "";
                    var stEmployeeNameValue = "";
                    var count = 0;
                    if (objSubordinatesListFinalResults.Monday.name.length > 0) {
                        for (var index = 0; index < objSubordinatesListFinalResults.Monday.name.length; index++) {
                            if (objSubordinatesListFinalResults.Monday.name[index] != stEmployeeName) {
                                if (count != 0) {
                                    stValue += ", ";
                                }
                                count++;
                                stValue += objSubordinatesListFinalResults.Monday.name[index];
                            } else {
                                stEmployeeNameValue = objSubordinatesListFinalResults.Monday.name[index] + ", ";
                            }
                            log.debug("stValue", stValue);
                        }
                    }
                    var objResult = {};
                    objResult.date = objSubordinatesListFinalResults.Monday.date;
                    var stDescription = (objSubordinatesListFinalResults.Monday.description) ? objSubordinatesListFinalResults.Monday.description : 'Planned Leaved';
                    stEmployeeNameValue = (stEmployeeNameValue) ? stEmployeeNameValue : "";
                    objResult.name = stDescription + ": " + stEmployeeNameValue + stValue;
                    objResult.customer = '';
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=";
                    objResult.durations = "";
                    arrResults.push(objResult);
                }
                
                if (!fn.objectIsempty(objSubordinatesListFinalResults.Tuesday)) {
                    var stValue = "";
                    var stEmployeeNameValue = "";
                    var count = 0;
                    if (objSubordinatesListFinalResults.Tuesday.name.length > 0) {
                        for (var index = 0; index < objSubordinatesListFinalResults.Tuesday.name.length; index++) {
                            
                            if (objSubordinatesListFinalResults.Tuesday.name[index] != stEmployeeName) {
                                if (count != 0) {
                                    stValue += ", ";
                                }
                                count++;
                                stValue += objSubordinatesListFinalResults.Tuesday.name[index];
                            } else {
                                stEmployeeNameValue = objSubordinatesListFinalResults.Tuesday.name[index] + "(ME)" + ", ";
                            }
                        }
                    }
                    var objResult = {};
                    objResult.date = objSubordinatesListFinalResults.Tuesday.date;
                    var stDescription = (objSubordinatesListFinalResults.Tuesday.description) ? objSubordinatesListFinalResults.Tuesday.description : 'Planned Leaved';
                    stEmployeeNameValue = (stEmployeeNameValue) ? stEmployeeNameValue : "";
                    objResult.name = stDescription + ": " + stEmployeeNameValue + stValue;
                    objResult.customer = '';
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=";
                    objResult.durations = "";
                    arrResults.push(objResult);
                }
                
                if (!fn.objectIsempty(objSubordinatesListFinalResults.Wednesday)) {
                    var stValue = "";
                    var count = 0;
                    if (objSubordinatesListFinalResults.Wednesday.name.length > 0) {
                        for (var index = 0; index < objSubordinatesListFinalResults.Wednesday.name.length; index++) {
                            if (objSubordinatesListFinalResults.Wednesday.name[index] != stEmployeeName) {
                                if (count != 0) {
                                    stValue += ", ";
                                }
                                count++;
                                stValue += objSubordinatesListFinalResults.Wednesday.name[index];
                            } else {
                                stEmployeeNameValue = objSubordinatesListFinalResults.Wednesday.name[index] + "(ME)" + ", ";
                            }
                            log.debug("stvalue wednesday", stValue);
                        }
                    }
                    var objResult = {};
                    objResult.date = objSubordinatesListFinalResults.Wednesday.date;
                    var stDescription = (objSubordinatesListFinalResults.Wednesday.description) ? objSubordinatesListFinalResults.Wednesday.description : 'Planned Leaved';
                    stEmployeeNameValue = (stEmployeeNameValue) ? stEmployeeNameValue : "";
                    objResult.name = stDescription + ": " + stEmployeeNameValue + stValue;
                    objResult.customer = '';
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=";
                    objResult.durations = "";
                    log.debug("wendesday", objResult);
                    arrResults.push(objResult);
                }
                
                if (!fn.objectIsempty(objSubordinatesListFinalResults.Thursday)) {
                    var stValue = "";
                    var count = 0;
                    if (objSubordinatesListFinalResults.Thursday.name.length > 0) {
                        for (var index = 0; index < objSubordinatesListFinalResults.Thursday.name.length; index++) {
                            
                            if (objSubordinatesListFinalResults.Thursday.name[index] != stEmployeeName) {
                                if (count != 0) {
                                    stValue += ", ";
                                }
                                count++;
                                stValue += objSubordinatesListFinalResults.Thursday.name[index];
                            } else {
                                stEmployeeNameValue = objSubordinatesListFinalResults.Thursday.name[index] + "(ME)" + ", ";
                            }
                        }
                    }
                    var objResult = {};
                    objResult.date = objSubordinatesListFinalResults.Thursday.date;
                    var stDescription = (objSubordinatesListFinalResults.Thursday.description) ? objSubordinatesListFinalResults.Thursday.description : 'Planned Leaved'
                    stEmployeeNameValue = (stEmployeeNameValue) ? stEmployeeNameValue : "";
                    objResult.name = stDescription + ": " + stEmployeeNameValue + stValue;
                    objResult.customer = '';
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=";
                    objResult.durations = "";
                    arrResults.push(objResult);
                }
                
                if (!fn.objectIsempty(objSubordinatesListFinalResults.Friday)) {
                    var stValue = "";
                    var count = 0;
                    if (objSubordinatesListFinalResults.Friday.name.length > 0) {
                        for (var index = 0; index < objSubordinatesListFinalResults.Friday.name.length; index++) {
                            if (objSubordinatesListFinalResults.Friday.name[index] != stEmployeeName) {
                                if (count != 0) {
                                    stValue += ", ";
                                }
                                count++;
                                stValue += objSubordinatesListFinalResults.Friday.name[index];
                            } else {
                                stEmployeeNameValue = objSubordinatesListFinalResults.Friday.name[index] + "(ME)" + ", ";
                            }
                        }
                    }
                    var objResult = {};
                    objResult.date = objSubordinatesListFinalResults.Friday.date;
                    var stDescription = (objSubordinatesListFinalResults.Friday.description) ? objSubordinatesListFinalResults.Friday.description : 'Planned Leaved'
                    stEmployeeNameValue = (stEmployeeNameValue) ? stEmployeeNameValue : "";
                    objResult.name = stDescription + ": " + stEmployeeNameValue + stValue;
                    objResult.customer = '';
                    objResult.location = '';
                    objResult.class = '';
                    objResult.time = '';
                    objResult.timezone = '';
                    objResult.type = "working";
                    objResult.img = "https://3688201.app.netsuite.com/core/media/media.nl?id=84298&amp;c=3688201&amp;h=d6a53521d354a8f43e2b&amp;fcts=20200901004234&amp;whence=";
                    objResult.durations = "";
                    arrResults.push(objResult);
                }
                
                log.debug("pto arrResults", arrResults)
                return arrResults;
            } catch (e) {
                log.error("getRequestTimeOffEvents exception:", e);
            }
        }
    
    
        fn.getMonthFirstEndDate = function (stTimeZone) {
            var objDates = {};
            try {
                var date = new Date();
            
                if (stTimeZone) {
                
                    date = format.parse({
                        value: date,
                        type: format.Type.DATETIME,
                        timezone: stTimeZone
                    });
                
                }
                // var ds_date = new Date('September 7, 2020');
            
                var dtNextWeekDate = fn.getNextWeekDay(date);
            
            
                var dtThisWeekDate = fn.getThisWeekDay(date);
                var dtThisFirstDayOfWeek = getMonday(dtThisWeekDate);
                var dtThisLastDayOfWeek = getFriday(dtThisWeekDate);
            
                objDates.weekNumber = fn.numberWeeks(dtNextWeekDate);
                objDates.firstDay = new Date(dtNextWeekDate.getFullYear(), dtNextWeekDate.getMonth(), 1);
                objDates.lastDay = new Date(dtNextWeekDate.getFullYear(), dtNextWeekDate.getMonth() + 1, 0);
                objDates.firstDayText = objDates.firstDay.getDate() + '-' + fn.monthConvertToString[objDates.firstDay.getMonth()] + '-' + objDates.firstDay.getFullYear();
                objDates.lastDayText = objDates.lastDay.getDate() + '-' + fn.monthConvertToString[objDates.lastDay.getMonth()] + '-' + objDates.lastDay.getFullYear();
                objDates.firstDayOfWeek = getMonday(dtNextWeekDate);
                objDates.lastDayOfWeek = getFriday(dtNextWeekDate);
                objDates.firstDayOfWeekText = objDates.firstDayOfWeek.getDate() + '-' + fn.monthConvertToString[objDates.firstDayOfWeek.getMonth()] + '-' + objDates.firstDayOfWeek.getFullYear();
                objDates.lastDayOfWeekText = objDates.lastDayOfWeek.getDate() + '-' + fn.monthConvertToString[objDates.lastDayOfWeek.getMonth()] + '-' + objDates.lastDayOfWeek.getFullYear();
                objDates.thisWeekFirstDayOfWeekText = dtThisFirstDayOfWeek.getDate() + '-' + fn.monthConvertToString[dtThisFirstDayOfWeek.getMonth()] + '-' + dtThisFirstDayOfWeek.getFullYear();
                objDates.thisWeekLastDayOfWeekText = dtThisLastDayOfWeek.getDate() + '-' + fn.monthConvertToString[dtThisLastDayOfWeek.getMonth()] + '-' + dtThisLastDayOfWeek.getFullYear();
            
            } catch (e) {
                log.debug('getMonthFirstEndDate', e);
            }
            return objDates;
        }
        
        fn.objectIsempty = function (obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        }
        
        fn.searchEmployeeName = function (employeeId) {
            var stEmployeeName = "";
            var employeeSearchObj = search.create({
                type: "employee",
                filters:
                    [
                        ["internalid", "anyof", employeeId]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "entityid",
                            sort: search.Sort.ASC,
                            label: "Name"
                        })
                    ]
            });
            var searchResultCount = employeeSearchObj.runPaged().count;
            log.debug("employeeSearchObj result count", searchResultCount);
            employeeSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                stEmployeeName = result.getValue({
                    name: "entityid"
                });
                return true;
            });
            return stEmployeeName;
        }
        
        
        fn.includeArrays = function (arrResult, arrData) {
            return arrResult.concat(arrData);
        }
        
        fn.getEmployeeLocationTimeZone = function (stEmployee) {
            var objLocation = {};
            objLocation.id = null;
            objLocation.timezone = null;
            var stTimeZone = null;
            try {
                var stLocationId = null;
                var fldLocation = search.lookupFields({
                    type: search.Type.EMPLOYEE,
                    id: stEmployee,
                    columns: ['location']
                });
                
                
                if (fldLocation.location[0]) {
                    stLocationId = fldLocation.location[0].value;
                }
                
                if (stLocationId) {
                    objLocation.id = stLocationId;
                    var fldTimeZone = search.lookupFields({
                        type: search.Type.LOCATION,
                        id: stLocationId,
                        columns: ['timezone']
                    });
                    
                    if (fldTimeZone.timezone[0]) {
                        stTimeZone = fldTimeZone.timezone[0].value;
                        objLocation.timezone = stTimeZone;
                    }
                }
            } catch (e) {
                log.debug('fn.getEmployeeLocationTimeZone', e);
            }
            return objLocation;
        }
        
        fn.createNewThread = function (stHost, stAccessToken, stThreadId, stMessage) {
            try {
                var stResponse = null;
                var stURL = stHost + '/v7.0/me/messages?access_token=' + stAccessToken;
                var headers = [];
                headers['Content-Type'] = 'application/json';
                
                var objBody = {
                    "recipient": {
                        "thread_key": stThreadId
                    },
                    "message": {
                        "text": stMessage
                    }
                }
                
                var objResponse = https.post({
                    headers: headers,
                    url: stURL,
                    body: JSON.stringify(objBody),
                });
                var objResponseBody = JSON.parse(objResponse.body);
                
                if (objResponseBody) {
                    stResponse = objResponseBody;
                }
                
                
            } catch (e) {
                log.debug('fn.createNewThread', e);
            }
            return stResponse;
        }
        
        fn.updateThreadName = function (stHost, stAccessToken, stThreadId, stNewName) {
            try {
                var stResponse = null;
                var stURL = stHost + '/t_' + stThreadId + '/threadname=' + stAccessToken;
                var headers = [];
                headers['Content-Type'] = 'application/json';
                
                var objBody = {
                    "name": stNewName
                }
                
                var objResponse = https.post({
                    headers: headers,
                    url: stURL,
                    body: JSON.stringify(objBody),
                });
                var objResponseBody = JSON.parse(objResponse.body);
                
                if (objResponseBody) {
                    stResponse = objResponseBody;
                }
                
            } catch (e) {
                log.debug('fn.createNewThread', e);
            }
            return stResponse;
        }
        
        fn.getFBWorkplaceApp = function (wpId) {
            var objResult = {};
            try {
                var recWorkplaceApp = record.load({
                    type: 'customrecord_sr_fb_wc_application_type',
                    id: wpId
                });
                objResult.savedsearch = recWorkplaceApp.getValue('custrecord_sr_fb_wc_rec_saved_search');
                objResult.type = recWorkplaceApp.getValue('custrecord_sr_fb_wc_app_type');
                objResult.message = recWorkplaceApp.getValue('custrecord_sr_fb_wc_app_message');
                objResult.config = recWorkplaceApp.getValue('custrecord_sr_fb_wc_access_config');
            } catch (e) {
                log.debug('getFBWorkplaceApp=>e', e);
            }
            
            return objResult;
        }
        
        fn.BetweenDatesValidation = function (dtFromDate, dtToDate, dtCheck) {
            var dtFirstDate, dtLastDate, dtCheckDate;
            dtFirstDate = Date.parse(dtFromDate);
            dtLastDate = Date.parse(dtToDate);
            dtCheckDate = Date.parse(dtCheck);
            
            if ((dtCheckDate <= dtLastDate && dtCheckDate >= dtFirstDate)) {
                return true;
            }
            return false;
        }
        
        fn.createFBWorkplaceLog = function (appType, arrRecipientList, errorCount, arrErrorMessage, startDate) {
            var arrError = [];
            try {
                var appTypeObj = {
                    'r1p': 1,
                    'timeoffrequest': 2,
                    'timebill': 3,
                    'weeklytimebill': 4
                }
                
                log.debug('arrRecipientList', arrRecipientList);
                log.debug('arrRecipientList.length', arrRecipientList.length);
                var recSummaryLog = record.create({
                    type: 'customrecord_sr_fb_wc_integration_log',
                });
                
                log.debug("arrErrorMessage:", arrErrorMessage);
                
                recSummaryLog.setValue('custrecord_sr_fb_wc_application_name', appTypeObj[appType]);
                recSummaryLog.setValue('custrecord_sr_fb_wc_date_time_started', startDate);
                recSummaryLog.setValue('custrecord_sr_fb_wc_recipient_list', arrRecipientList);
                recSummaryLog.setValue('custrecordsr_fb_wc_number_of_recipients', arrRecipientList.length);
                recSummaryLog.setValue('custrecord_sr_fb_wc_error_message_enc', errorCount);

                for (var index in arrErrorMessage) {
                    var objErrorMessage = {};
                    objErrorMessage.EmployeeName = arrErrorMessage[index].employeeName;
                    objErrorMessage.RecipientId = arrErrorMessage[index].recipientId;
                    objErrorMessage.ErrorMessage = arrErrorMessage[index].errorMessage;
                    arrError.push(objErrorMessage);
                }
                recSummaryLog.setValue('custrecord_sr_fb_wc_error_message', JSON.stringify(arrError));
                
                recSummaryLog.setValue('custrecord_sr_fb_wc_date_ended', new Date());
                
                recSummaryLog.save({
                    ignoreMandatoryFields: true,
                    enableSourcing: true
                });
                
            } catch (e) {
                log.error('createFBWorkplaceLog=>error', e);
            }
        }
        
        
        fn.monthConvertToString = {
            0: 'Jan',
            1: 'Feb',
            2: 'Mar',
            3: 'Apr',
            4: 'May',
            5: 'Jun',
            6: 'Jul',
            7: 'Aug',
            8: 'Sep',
            9: 'Oct',
            10: 'Nov',
            11: 'Dec'
        }
        fn.convertToSuffix = {
            1: "1st",
            2: "2nd",
            3: "3rd",
            4: "4th",
            5: "5th",
            6: "6th",
            7: "7th",
            8: "8th",
            9: "9th",
            10: "10th",
            11: "11th",
            12: "12th",
            13: "13th",
            14: "14th",
            15: "15th",
            16: "16th",
            17: "17th",
            18: "18th",
            19: "19th",
            20: "20th",
            21: "21st",
            22: "22nd",
            23: "23rd",
            24: "24th",
            25: "25th",
            26: "26th",
            27: "27th",
            28: "28th",
            29: "29th",
            30: "30th",
            31: "31st"
        };
        
        fn.convertToMonth = {
            0: "January",
            1: "Febuary",
            2: "March",
            3: "April",
            4: "May",
            5: "June",
            6: "July",
            7: "August",
            8: "September",
            9: "October",
            10: "November",
            11: "December"
        };
        
        fn.getFileType = {
            'APPCACHE': 'file',
            'AUTOCAD': 'file',
            'BMPIMAGE': 'image',
            'CERTIFICATE': 'file',
            'CONFIG': 'file',
            'CSV': 'file',
            'EXCEL': 'file',
            'FLASH': 'file',
            'FREEMARKER': 'file',
            'GIFIMAGE': 'image',
            'GZIP': 'file',
            'HTMLDOC': 'file',
            'ICON': 'image',
            'JAVASCRIPT': 'file',
            'JPGIMAGE': 'image',
            'JSON': 'file',
            'MESSAGERFC': 'file',
            'MP3': 'audio',
            'MPEGMOVIE': 'video',
            'MSPROJECT': 'file',
            'PDF': 'file',
            'PJPGIMAGE': 'image',
            'PLAINTEXT': 'file',
            'PNGIMAGE': 'image',
            'POSTSCRIPT': 'file',
            'POWERPOINT': 'file',
            'QUICKTIME': 'file',
            'RTF': 'file',
            'SCSS': 'file',
            'SMS': 'file',
            'STYLESHEET': 'file',
            'SVG': 'image',
            'TAR': 'image',
            'TIFFIMAGE': 'image',
            'VISIO': 'image',
            'WEBAPPPAGE': 'file',
            'WEBAPPSCRIPT': 'file',
            'WORD': 'file',
            'XMLDOC': '',
            'XSD': 'file',
            'ZIP': 'file'
        };
        
        /** SORT FUNCTION **/
        fn.sortArrayObjectByDate = function (arr) {
            return arr.sort(function (a, b) {
                //return ( new Date(a.date).getTime() > new Date(b.date).getTime()) ? 1 : -1;
                var dateA = new Date(a.date).getTime();
                var dateB = new Date(b.date).getTime();
                return dateA > dateB ? -1 : 1;
            });
        }
        
        /** CONVERT DECIMAL TO MINUTE**/
        function decToMin(minutes) {
            var sign = minutes < 0 ? "-" : "";
            var min = Math.floor(Math.abs(minutes));
            var sec = Math.floor((Math.abs(minutes) * 60) % 60);
            return sign + (min < 10 ? "" : "") + min + ":" + (sec < 10 ? "0" : "") + sec;
        }
        
        /**
         * Add days from date
         */
        function addDates(dtDate, intAdd) {
            var dtFutureDate = new Date(dtDate);
            dtFutureDate.setDate(dtFutureDate.getDate() + intAdd);
            return dtFutureDate;
        }
        
        function getMonday(d) {
            d = new Date(d);
            var day = d.getDay(),
                diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
            return new Date(d.setDate(diff));
        }
        
        function getFriday(d) {
            d = new Date(d);
            var day = d.getDay(),
                diff = d.getDate() - day + (day == 0 ? -2 : 5); // adjust when day is sunday
            return new Date(d.setDate(diff));
        }
        
        fn.getNextWeekDay = function (dtDate) {
            var today = new Date(dtDate);
            var stNextWeekDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
            return stNextWeekDay;
        }
    
        fn.getThisWeekDay = function (dtDate) {
            var today = new Date(dtDate);
            var stThisWeekDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            return stThisWeekDay;
        }
        
        fn.getHostUrl = function () {
            var hostURL = 'https://';
            hostURL += url.resolveDomain({
                hostType: url.HostType.APPLICATION
            });
            
            return hostURL;
        }
        
        fn.replaceAmpersand = function (str) {
            return str = str.replace(/&/g, "&amp;");
        }
        
        function replaceAmp(strText) {
            var str = "";
            strText = strText.replace(/&/g, "&amp;");
            log.debug("strText", strText);
            if (!stringChecker(strText)) {
                var arrText = strText.split(':');
                return (arrText.length > 1) ? arrText[1] : arrText[0];
            } else {
                return str;
            }
        }
        
        function stringChecker(str) {
            return str == null || str == "undefined" || str == "";
        }
        
        function convertTimetoLocaleTimeString(time) {
            var dateint = Date.parse("January 1, 2000 " + time);
            var dateObj = new Date(dateint);
            var milTime = dateObj.toLocaleTimeString();
            return milTime;
        }
        
        fn.setddMonthyyyy = function (stDate) {
            /*            log.debug("stDate:", stDate);*/
            var dtFormatDate = format.parse({
                value: stDate,
                type: format.Type.DATE
            });
            
            var month = [];
            month[0] = "Jan";
            month[1] = "Feb";
            month[2] = "Mar";
            month[3] = "Apr";
            month[4] = "May";
            month[5] = "Jun";
            month[6] = "Jul";
            month[7] = "Aug";
            month[8] = "Sep";
            month[9] = "Oct";
            month[10] = "Nov";
            month[11] = "Dec";
            var dtMonth = month[dtFormatDate.getMonth()];
            var dtDate = dtFormatDate.getDate();
            var dtYear = dtFormatDate.getFullYear();
            /*        log.debug("dtMonth:", dtMonth);*/
            return dtDate + "-" + dtMonth + "-" + dtYear;
        }
        
        
        Date.prototype.addHours = function (h) {
            this.setHours(this.getHours() + h);
            return this;
        }
        
        function stringToDate(stDate) {
            var dateToString = format.parse({
                value: stDate,
                type: format.Type.DATE
            });
            
            return format.format({
                value: dateToString,
                type: format.Type.DATE
            });
        }
        
        function setDateByNSTimeZone(dtDate) {
            var nsTimeZone = runtime.getCurrentUser().getPreference('TIMEZONE');
            
            var nsDate = format.format({
                value: dtDate,
                type: format.Type.DATETIME,
                timezone: nsTimeZone
            });
            
            log.debug('setDateByNSTimeZone=>nsTimeZone || nsDateTime', nsTimeZone + ' || ' + nsDate);
            // Australia/Brisbane || 2020-04-01 7:40:51 pm
            
            return format.parse({value: nsDate, type: format.Type.DATETIME});
        }
        
        
        function convertDateByTimeZone(dateValue, timeZoneFrom, timeZoneTo, time) {
            try {
                var stDate = dateValue;
                log.debug("stDate:", stDate);
                var now = new Date(fn.setmmddyyyy(stDate) + " " + time);
                log.debug("now:", now);
                var nsDate = setDateByNSTimeZone(now);
                log.debug("nsDate:", nsDate);
                
                var expectedDate = format.format({
                    value: nsDate,
                    type: format.Type.DATETIME,
                    timezone: timeZoneTo
                });
                log.debug("expectedDate", "timezone: " + timeZoneTo + " Date:" + expectedDate);
                
                return expectedDate;
            } catch (e) {
                log.error("exception:", e);
            }
            
        }
    
        //Version 1.9.4
    
        fn.nextWeekSummary = function (stEmployee, stSearchId, dtThisMonth, objLocation) {
            var objNextWeekSummary = fn.getPerEmployeeTimeBillNextWeek(stEmployee, stSearchId, dtThisMonth, objLocation);
            log.debug("objNextWeekSummary", objNextWeekSummary);
            return objNextWeekSummary;
        }
    
        fn.getPerEmployeeTimeBillNextWeek = function (stEmployee, stSearchId, dtThisMonth, objLocation) {
            try {
                log.debug("start..", "getPerEmployeeTimeBillNextWeek");
                var dur, stPercentage, variance;
                var dtThisWeekDateDuration = fn.getPerEmployeeTimeBillThisWeek(stEmployee, dtThisMonth.thisWeekFirstDayOfWeekText, dtThisMonth.thisWeekLastDayOfWeekText);
                log.debug("dtThisWeekDateDuration", dtThisWeekDateDuration);
                var objResult = {};
                var timebillSearchObj = search.create({
                    type: "timebill",
                    filters:
                        [
                            ["type", "anyof", "B"],
                            "AND",
                            ["employee", "anyof", stEmployee],
                            "AND",
                            ["date", "within", dtThisMonth.firstDayOfWeekText, dtThisMonth.lastDayOfWeekText]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "employee",
                                summary: "GROUP",
                                label: "Employee"
                            }),
                            search.createColumn({
                                name: "durationdecimal",
                                summary: "SUM",
                                label: "Duration (Decimal)"
                            })
                        ]
                });
                var searchResultCount = timebillSearchObj.runPaged().count;
                log.debug("timebillSearchObj result count", searchResultCount);
                timebillSearchObj.run().each(function (result) {
                    // .run().each has a limit of 4,000 results
                
                    dur = result.getValue({
                        name: "durationdecimal",
                        summary: "SUM"
                    });
                
                    stPercentage = (dur) ? Math.floor((dur / 40) * 100) : 0;
                
                    //Allocated
                    objResult.percentage = stPercentage;
                    objResult.durations = decToMin(Number(dur).toFixed(2));
                    variance = fn.variance(dtThisWeekDateDuration, dur);
                    var getVarience = fn.variance(dtThisWeekDateDuration, dur);
                    objResult.variance = fn.checkVarienceValue(getVarience);
                
                    return true;
                });
                log.debug("getPerEmployeeTimeBillNextWeek objResult", objResult);
            
                objResult.percentage = (objResult.percentage) ?  objResult.percentage : 0;
                objResult.durations = (objResult.durations) ?  objResult.durations : 0;
                if(objResult.variance) {
                    objResult.variance = objResult.variance;
                }else{
                    dur = (dur) ? dur : 0;
                    var getVarience = fn.variance(dtThisWeekDateDuration, dur);
                    objResult.variance = fn.checkVarienceValue(getVarience);
                }
            
                //Missing
                var objMissingValue = fn.missingTimeinPercent(stPercentage, dur, variance);
                objResult.missingPercentage = objMissingValue.missingPercentage;
                objResult.missingDurations = decToMin(Number(objMissingValue.missingDurations).toFixed(2));
                objResult.missingVariance =  fn.checkVarienceValue(objMissingValue.missingVariance);
            
                //Holiday and Company Events
                objResult.countEmployeeHoliday = fn.countEmployeeHoliday(stEmployee)
                objResult.countTractionEvents = fn.countTractionEvents(stEmployee, stSearchId, dtThisMonth.firstDay.getMonth(), objLocation.id, objLocation.timezone, dtThisMonth.firstDayOfWeekText, dtThisMonth.lastDayOfWeekText)
                objResult.countTotal = objResult.countEmployeeHoliday + objResult.countTractionEvents;
            
                //PTO
                var objCountPTO = fn.countEmployeePTO(stEmployee, dtThisMonth.firstDayOfWeekText, dtThisMonth.lastDayOfWeekText);
                objResult.nextWeekPTO = objCountPTO.nextWeekPTO;
                objResult.takenPTO = objCountPTO.taken;
                objResult.leftPTO = objCountPTO.left;
            
                log.debug("objResult", objResult);
            
                return objResult;
            }
            catch (e){
                log.debug("exception getPerEmployeeTimeBillNextWeek:", e);
            }
        }
    
        fn.getPerEmployeeTimeBillThisWeek = function (stEmployee, stStartDate, stEndDate) {
            var arrEmpTimeBillThisWeek = {}
            var timebillSearchObj = search.create({
                type: "timebill",
                filters:
                    [
                        ["type", "anyof", "B"],
                        "AND",
                        ["employee", "anyof", stEmployee],
                        "AND",
                        ["date", "within", stStartDate, stEndDate]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "employee",
                            summary: "GROUP",
                            label: "Employee"
                        }),
                        search.createColumn({
                            name: "durationdecimal",
                            summary: "SUM",
                            label: "Duration (Decimal)"
                        })
                    ]
            });
            var searchResultCount = timebillSearchObj.runPaged().count;
            var Durations;
            log.debug("timebillSearchObj result count", searchResultCount);
            timebillSearchObj.run().each(function (result) {
                // .run().each has a limit of 4,000 results
                var objResult = {};
            
                Durations = result.getValue({
                    name: "durationdecimal",
                    summary: "SUM"
                })
            
                /*arrEmpTimeBillThisWeek.push(objResult);*/
                return true;
            });
            log.debug("Durations", Durations);
            return Durations;
        }
    
    
        fn.variance = function(dtThisWeekDuration, dtNextWeekDuration) {
            try {
                var increase = (dtThisWeekDuration - dtNextWeekDuration) ? (dtThisWeekDuration - dtNextWeekDuration) : 0;
                var increaseByPercentage = ((increase / dtNextWeekDuration) * 100) ? Math.floor((increase / dtNextWeekDuration) * 100) : 0;
            
                return increaseByPercentage;
            } catch (e) {
                log.error("exception variance:", e);
            }
        }
    
        fn.checkVarienceValue = function(variance){
            var stHTMLVarianceValue = "";
            var stVariance = variance + "%";
            try{
                if(Number(variance) > 0){
                    stHTMLVarianceValue += '<table>';
                    stHTMLVarianceValue += '<tr>';
                    stHTMLVarianceValue += '<td><img height="5px" width="8px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=105317&amp;c=3688201&amp;h=hWrgv4NNJlDN1j_3XTveLMejgrWKTQFK_ev60JFTsa8onwAg&amp;fcts=20201112174715&amp;whence=" /></td>';
                    stHTMLVarianceValue += '<td style="font-size: 8px;"> ' + stVariance + '</td>';
                    stHTMLVarianceValue += '</tr>';
                    stHTMLVarianceValue += '</table>';
                }else{
                    stHTMLVarianceValue += '<table>';
                    stHTMLVarianceValue += '<tr>';
                    stHTMLVarianceValue += '<td><img height="5px" width="8px" src="https://3688201.app.netsuite.com/core/media/media.nl?id=105316&amp;c=3688201&amp;h=9IS2LoUGhU2jtatm4sT8gzM_PSdeZbSkHJWbOO1wM9XdpIBC&amp;fcts=20201112174615&amp;whence=" /></td>';
                    stHTMLVarianceValue += '<td style="font-size: 8px;"> ' + stVariance + '</td>';
                    stHTMLVarianceValue += '</tr>';
                    stHTMLVarianceValue += '</table>';
                }
            }
            catch (e){
                log.debug("exception checkVarienceValue",e);
            }
            return stHTMLVarianceValue;
        }
    
        fn.missingTimeinPercent = function(stPercentage, dur, variance){
            try {
                var objResult = {};
                if (stPercentage > 100) {
                    var percentage = (Number(stPercentage) - 100) ? (Number(stPercentage) - 100) : 0;
                    objResult.missingPercentage = (percentage) ? "-" + percentage.toString() : 0;
                } else {
                    var percentage = (Number(stPercentage) - 100) ? (Number(stPercentage) - 100) : 0;
                    objResult.missingPercentage = percentage;
                }
            
                if (dur > 40) {
                    var duration = (dur) ? dur - 40 : 0;
                    objResult.missingDurations = (duration) ? "-" + duration : 0;
                } else {
                    var duration = (dur) ? Number(dur) - 40 : 0;
                    objResult.missingDurations = duration;
                }
            
                if (variance > 100) {
                
                    var variance = (variance - 100) ? variance - 100 : 0;
                    objResult.missingVariance = (variance) ? "-" + variance.toString() : 0;
                } else {
                    var variance = (variance) ? variance - 100 : 0;
                    objResult.missingVariance = variance;
                }
                return objResult;
            }
            catch (e){
                log.debug("exception missingTimeinPercent:", e);
            }
        }
    
        fn.countEmployeeHoliday = function (stEmployee, stThisMonth) {
            try {
            
                var count= 0;
                var today = new Date();
                var arrExecptionDays = [];
                var recEmployee = record.load({
                    type: 'employee',
                    id: stEmployee
                });
                var workCalendarId = recEmployee.getValue('workcalendar');
                if (workCalendarId) {
                    var recWorkCalendar = record.load({
                        type: 'workcalendar',
                        id: workCalendarId,
                        isDynamic: true
                    });
                    var dtToday = new Date();
                    var dtSixtyDays = addDates(new Date(), 60);
                    var lineCount = recWorkCalendar.getLineCount('workcalendarexception');
                    if (lineCount > 0) {
                        for (var indx = 0; indx < lineCount; indx++) {
                        
                            var excepDate = recWorkCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'exceptiondate',
                                line: indx
                            });
                        
                        
                            var holidayName = recWorkCalendar.getSublistValue({
                                sublistId: 'workcalendarexception',
                                fieldId: 'description',
                                line: indx
                            });
                        
                            //GET THE HOLIDAY ONCE THE DATE BETWEEN TODAY TO 60 DAY FROM TODAY
                            //log.debug('dates','excepDate=>'+excepDate + '<br/> dtToday=>'+dtToday+ '<br/> dtSixtyDays=>'+dtSixtyDays);
                            if (excepDate.getTime() <= dtSixtyDays.getTime() && excepDate.getTime() >= dtToday.getTime()) {
                                count++;
                            }
                        }
                    }
                
                }
            
            } catch (e) {
                log.debug('getNonWorkingHolidaysEvents', e);
            }
            return count;
        }
    
    
        fn.countTractionEvents = function (stSearchId, stLocation, stLocationTimeZone, stStartDate, stEndDate) {
            var arrResults = [];
            var count = 0;
            try {
                var searchObj = search.load({
                    id: stSearchId
                });
                var arrFilters = [];
                arrFilters.push("AND");
                arrFilters.push(["custrecord_sr_event_date", "within", stStartDate, stEndDate]);
                arrFilters.push("AND");
                arrFilters.push(["custrecord_sr_event_location", "anyof", stLocation]);
            
            
                searchObj.filterExpression = searchObj.filterExpression.concat(arrFilters);
                searchObj.run().each(function (result) {
                    count++;
                    return true;
                });
            } catch (e) {
                log.debug('getTractionEvents', e);
            }
            return count;
        }
    
        fn.countEmployeePTO = function(stEmployee, stStartDate, stEndDate){
            var objResult = {};
            var countTotal = 0;
            var countTaken = 0;
            var countLeft = 0;
            var timeoffrequestSearchObj = search.create({
                type: "timeoffrequest",
                filters:
                    [
                        ["employee","anyof",stEmployee],
                        "AND",
                        ["timeoffrequestdetail.timeofftype","anyof","1"],
                        "AND",
                        ["approvalstatus", "anyof", "8"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "startdate",
                            sort: search.Sort.ASC,
                            label: "Start Date"
                        }),
                        search.createColumn({name: "employee", label: "Employee"})
                    ]
            });
            var searchResultCount = timeoffrequestSearchObj.runPaged().count;
            log.debug("timeoffrequestSearchObj result count",searchResultCount);
            timeoffrequestSearchObj.run().each(function(result){
                var date = result.getValue({
                    name: "startdate"
                });
                countTotal++;
                if(stStartDate > date){
                    countTaken++;
                }else{
                    countLeft++;
                }
                // .run().each has a limit of 4,000 results
                return true;
            });
        
        
            objResult.nextWeekPTO = fn.countNextWeekRequestTimeOffEvents(stEmployee, stStartDate, stEndDate);
            objResult.taken = countTaken;
            objResult.left = countLeft;
            return objResult;
        }
    
        fn.countNextWeekRequestTimeOffEvents = function (stEmployee, stStartDate, stEndDate) {
            var count = 0;
            try {
                var timeoffrequestSearchObj = search.create({
                    type: "timeoffrequest",
                    filters:
                        [
                            ["employee", "anyof", stEmployee],
                            "AND",
                            [["startdate", "onorafter", stStartDate], "AND", ["enddate", "onorbefore", stEndDate]],
                            "AND",
                            ["approvalstatus", "anyof", "8"]
                        ],
                    columns:
                        [
                            search.createColumn({
                                name: "startdate",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "enddate",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "timeofftype",
                                summary: "GROUP"
                            }),
                            search.createColumn({
                                name: "amountoftime",
                                join: "timeOffRequestDetail",
                                summary: "SUM"
                            })
                        ]
                });
            
                timeoffrequestSearchObj.run().each(function (result) {
                    count++;
                    return true;
                });
            
            } catch (e) {
                log.debug('getRequestTimeOffEvents', e);
            }
            return count;
        }
        
        //Version 1.9.5
        fn.createNoteLine = function () {
            var stValue = "";
            try {
                for(var index=0; index < 26; index++) {
                    stValue += '<tr style="border-collapse:collapse;">';
                    stValue += '<td style="height: 25px; text-align: left;  font-size: 14px; border-bottom: 1px solid #221F1F; border-right: 1px solid #221F1F;"></td>';
                    stValue += '<td style="height: 25px; text-align: left;  font-size: 14px; border-bottom: 1px solid #221F1F; border-right: 1px solid #221F1F;"></td>';
                    stValue += '<td style="height: 25px; text-align: left;  font-size: 14px; border-bottom: 1px solid #221F1F; border-right: 1px solid #221F1F;"></td>';
                    stValue += '<td style="height: 25px; text-align: left;  font-size: 14px; border-bottom: 1px solid #221F1F; border-right: 1px solid #221F1F;"></td>';
                    stValue += '<td style="height: 25px; text-align: left;  font-size: 14px; border-bottom: 1px solid #221F1F;"></td>';
                    stValue += '</tr>';
                }
                return stValue;
            } catch (e) {
            
            }
        }
        
        //Version 1.9.6
    
        fn.thisWeekSummary = function (stEmployee, stSearchId, dtThisMonth, objLocation) {
            var objNextWeekSummary = fn.getPerEmployeeTimeBillFirstDayAndLastDay(stEmployee, stSearchId, dtThisMonth, objLocation);
            return objNextWeekSummary;
        }
    
        fn.getPerEmployeeTimeBillFirstDayAndLastDay = function (stEmployee, stSearchId, dtThisMonth, objLocation) {
            try {
                var objResult = {};
                log.debug("getPerEmployeeTimeBillFirstDayAndLastDay..", dtThisMonth);
                var dur, stPercentage, variance;
                var dtThisWeekDateDuration = fn.getPerEmployeeTimeBillThisWeek(stEmployee, dtThisMonth.thisWeekFirstDayOfWeekText, dtThisMonth.thisWeekLastDayOfWeekText);
                var decLogged = ((dtThisWeekDateDuration / 40) * 100) ? (dtThisWeekDateDuration / 40) * 100 : 0
                objResult.weekLogged = decLogged;
                objResult.weekMissing =   (100 - decLogged) ? 100 - decLogged : 0;
            
                //Holiday and Company Events
                var countEmployeeHoliday = fn.countEmployeeHoliday(stEmployee)
                var countTractionEvents = fn.countTractionEvents(stEmployee, stSearchId, dtThisMonth.firstDay.getMonth(), objLocation.id, objLocation.timezone, dtThisMonth.thisWeekFirstDayOfWeekText, dtThisMonth.thisWeekLastDayOfWeekText)
                objResult.weekEvents = countEmployeeHoliday + countTractionEvents;
            
                //PTO
                var objCountPTO = fn.countEmployeePTO(stEmployee, dtThisMonth.thisWeekFirstDayOfWeekText, dtThisMonth.thisWeekLastDayOfWeekText);
                objResult.weekPTO = objCountPTO.nextWeekPTO;
                log.debug("getPerEmployeeTimeBillFirstDayAndLastDay objResult", objResult);
                return objResult;
            } catch (e) {
                log.debug("exception getPerEmployeeTimeBillNextWeek:", e);
            }
        }

        //Version 1.9.7

        fn.checkMessageFromManager = function (stEmployee, stStartDate, stEndDate) {
            log.debug('checkMessageFromManager Params', stEmployee + ' ' + stStartDate + ' ' + stEndDate);
            try{
                var stMessage = "";
                var stSupervisor = fn.getManager(stEmployee);
                log.debug('findCalendarEventMessage Params', stSupervisor[0].value + ' ' + stEmployee + ' ' + stStartDate + ' ' + stEndDate);
                var objCalendarEventDetails = fn.findCalendarEventMessage(stSupervisor[0].value, stEmployee, stStartDate, stEndDate);
                log.debug('objCalendarEventDetails', objCalendarEventDetails);
                if(objCalendarEventDetails){
                    var eventDate = objCalendarEventDetails.date;
                    var parseStartDate = stStartDate;
                    var parseEndDate = stEndDate;
                    if(eventDate >= parseStartDate && eventDate <= parseEndDate){
                        if(objCalendarEventDetails.message.length == 0) {
                            stMessage += "";
                        } else if(objCalendarEventDetails.message.length > 255) {
                            var trimmedString = objCalendarEventDetails.message.substring(0, 255);
                            stMessage += '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 15px; line-height: 10; "></td>\n' +
                                '</tr>\n' +
                                '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 12px; line-height: 10; padding-left: 8px; padding-right: 8px;"><strong>Manager\'s Message</strong></td>\n' +
                                '</tr>\n' +
                                '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 8px; line-height: 10; padding-left: 8px; padding-right: 8px;">' + trimmedString + '...' + '<a href="' + fn.getCalendarEventUrl(objCalendarEventDetails.id) + '">See more</a>' + '</td>\n' +
                                '</tr>';
                        } else {
                            stMessage += '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 15px; line-height: 10; "></td>\n' +
                                '</tr>\n' +
                                '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 12px; line-height: 10; padding-left: 8px; padding-right: 8px;"><strong>Manager\'s Message</strong></td>\n' +
                                '</tr>\n' +
                                '<tr style="background-color: #f5f5f5; ">\n' +
                                '<td align="Left" style="font-size: 8px; line-height: 10; padding-left: 8px; padding-right: 8px;">' + objCalendarEventDetails.message + '</td>\n' +
                                '</tr>'
                        }
                    } else {
                        log.debug('Notice', 'No new events found for ' + stStartDate + ' to ' + stEndDate);
                        stMessage += "";
                    }
                }
            } catch (e) {
                log.debug("exception checkMessageFromManager:", e);
            }
            return stMessage;
        }

        fn.getManager = function (stEmployee) {
            var employeeLookUp = search.lookupFields({
                type: search.Type.EMPLOYEE,
                id: stEmployee,
                columns: ['supervisor']
            });
            if(employeeLookUp) {
                var stSupervisor = employeeLookUp['supervisor'];
            }
            return stSupervisor;
        }


        fn.getCalendarEventUrl = function (stEventId) {
            var calendarEventUrl = "";
            try {
                var scheme = 'https://';
                var accountId = runtime.accountId;
                var host = url.resolveDomain({
                    hostType: url.HostType.APPLICATION,
                    accountId: accountId
                })

                var relativePath = url.resolveRecord({
                    recordType: record.Type.CALENDAR_EVENT,
                    recordId: stEventId
                });
                calendarEventUrl = scheme + host + relativePath;
                var cleanCalendarEventUrl = calendarEventUrl.replace('&', '&amp;');
                log.debug('calendarEventUrl', cleanCalendarEventUrl);

            }catch(e){
                log.debug("error in getVendorBillUrl()", e);
            }

            return cleanCalendarEventUrl;
        }

        fn.findCalendarEventMessage = function (stManager, stEmployee, stStartDate, stEndDate) {
            var objCalendarEvent = {};
            try{
                var calendareventSearchObj = search.create({
                    type: "calendarevent",
                    filters:
                        [
                            ["organizer","anyof",stManager],
                            "AND",
                            ["attendee","anyof",stEmployee],
                            "AND",
                            ["date","within",stStartDate,stEndDate]
                        ],
                    columns:
                        [
                            "title",
                            search.createColumn({
                                name: "startdate",
                                sort: search.Sort.ASC
                            }),
                            "starttime",
                            "endtime",
                            "owner",
                            "status",
                            "markdone",
                            "message"
                        ]
                });
                var searchResultCount = calendareventSearchObj.runPaged().count;
                log.debug("calendareventSearchObj result count",searchResultCount);
                var myPagedData = calendareventSearchObj.runPaged({
                    pageSize: 1000
                });
                myPagedData.pageRanges.forEach(function(pageRange) {
                    var myPage = myPagedData.fetch({
                        index: pageRange.index
                    });
                    myPage.data.forEach(function (result) {
                        var message = result.getValue({
                            name: "message"
                        });

                        var startDate = result.getValue({
                            name: "startdate"
                        });

                        objCalendarEvent.id = result.id;
                        objCalendarEvent.date = startDate;
                        objCalendarEvent.message = message;
                    });
                });

            } catch (e) {
                log.debug("exception findCalendarEventMessage:", e);
            }
            return objCalendarEvent;
        }
        return fn;
        
    })

