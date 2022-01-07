define(['N/search', 'N/record', 'N/log' ,'N/runtime','N/email'],
    function (search, record, log , runtime ,email) {
        var fn = {};
        fn.CreateJournal = function (subsidaryD,classD,departmentD,locationD,lvCurrency,timeTrackId,finalLineMemo,accountDr,finalAmount,accountCr,billCbk) {
            try{
                var currentUser = 239241;
                var currentUserEmail = 'rubykumari413@gmail.com';
                if(accountDr == '1'){accountDr = 913;}else if(accountDr == '2'){accountDr = 914;}else if(accountDr == -3){accountDr = 885;}else{accountDr = 884;}
                /*
                //// @@@@@@@@@@@@ Account Map @@@@@@@@@@@ ////
                Direct Salary == 61190 Project Direct Salary (895/913)
                Indirect Salary == Project Indirect Salary  (896/914)
                Overhead == Indirect Labor   (885)
                Regular  == Direct Labor    (884)
                //// @@@@@@@@@@@@ Account Map END @@@@@@@@@@@ ////*/

                //creating journal record
                journalRecordCreate = record.create({
                    type: 'journalentry',
                    isDynamic: true                       
                });
                journalRecordCreate.setValue({
                    fieldId : 'subsidiary',
                    value : subsidaryD
                });
                journalRecordCreate.setValue({
                    fieldId : 'currency',
                    value : lvCurrency
                });
                journalRecordCreate.setValue({
                    fieldId : 'trandate',
                    value : new Date()
                });
                journalRecordCreate.setValue({
                    fieldId : 'approved',
                    value : true
                });
                journalRecordCreate.setValue({
                    fieldId : 'timebillflag',
                    value : 'T'
                });
                journalRecordCreate.setValue({
                    fieldId : 'custbody_sr_time_track_link',
                    value : timeTrackId
                });
                var type = 'debit';
                addLineDataOnJournalRecord(finalLineMemo,accountDr,finalAmount,type);
                var type = 'credit';
                addLineDataOnJournalRecord(finalLineMemo,accountCr,finalAmount,type);
                try{
                    if(billCbk == false || billCbk == 'F' || billCbk == ''){
                        var journalRecordId = journalRecordCreate.save({
                            enableSourcing: true,
                            ignoreMandatoryFields: true
                        });
                        log.debug('journalRecordId',journalRecordId)
                        var recordSubmit = record.submitFields({
                            type: 'timebill',
                            id: timeTrackId,
                            values: {
                                'posted': 'T',
                                'transactionid':Number(journalRecordId)
                            },
                            options: {
                                enableSourcing: true,
                                ignoreMandatoryFields : true
                            }
                        });
                        log.debug('recordSubmit',recordSubmit)
                    }else{
                        log.debug('its charges')
                    }
                }catch(journalRecordSubmitError){
                    record.submitFields({
                        type: 'timebill',
                        id: timeTrackId,
                        values: {
                            'posted': 'F'
                        }
                    });
                    log.error({title:'Error in journal Creation: ', details:journalRecordSubmitError});
                    email.send({author: currentUser,
                        recipients: currentUserEmail,
                        subject: 'Error while submitting journal for Time sheet: '+timeTrackId+'',
                        body: 'Hi,\n Error is:\n '+journalRecordSubmitError+''
                    });
                }
            } catch (e) {
                log.debug('getAccessToken', e);
            }
            return ;
        }
        return fn;
    })
    function addLineDataOnJournalRecord(memo,account,ammount,type){
        if(ammount != '' && ammount != undefined || ammount != null){
            if(account != '' && account != undefined){
                if(type == 'credit'){
                    var line = journalRecordCreate.getLineCount({
                        sublistId: 'line'
                    });
                    journalRecordCreate.selectLine({
                        sublistId: 'line',
                        line: line
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: account
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'credit',
                        value: ammount
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: memo
                    });
                    try{
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'department',
                            value: departmentD
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: classD
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: locationD
                        });
                    }catch(e){
                        log.debug("issue with department")
                    }
                    journalRecordCreate.commitLine({ sublistId: 'line'});  
                }else if(type == 'debit'){
                    var line = journalRecordCreate.getLineCount({
                        sublistId: 'line'
                    });
                    journalRecordCreate.selectLine({
                        sublistId: 'line',
                        line: line
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'account',
                        value: account
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'debit',
                        value: ammount
                    });
                    journalRecordCreate.setCurrentSublistValue({
                        sublistId: 'line',
                        fieldId: 'memo',
                        value: memo
                    });
                    try{
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'department',
                            value: departmentD
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'class',
                            value: classD
                        });
                        journalRecordCreate.setCurrentSublistValue({
                            sublistId: 'line',
                            fieldId: 'location',
                            value: locationD
                        });
                    }catch(e){
                        log.debug("issue with department")
                    }
                    journalRecordCreate.commitLine({sublistId: 'line'});
                } 
            }
        }
    }