define(['N/search'],

    function (search) {
        var func = {};
        var inProjectType = 110;

        func.timeEntryPMO = function (scriptContext) {
            log.debug('Start Script');

            var inCustomer = scriptContext.getValue({
                fieldId: 'customer'
            });
            log.debug('inCustomer', inCustomer);

            if (inCustomer) {
                var inFldLookUp = search.lookupFields({
                    type: search.Type.JOB,
                    id: inCustomer,
                    columns: ['jobtype']
                });
                log.debug('inFldLookUp', inFldLookUp);
                log.debug('inFldLookUp.jobtype[0].value', inFldLookUp.jobtype[0].value);
                if (inFldLookUp.jobtype[0].value) {
                    if (inFldLookUp.jobtype[0].value == inProjectType) {
                        scriptContext.setValue({
                            fieldId: 'custcol_sr_is_pmo',
                            value: true
                        });
                    } else {
                        scriptContext.setValue({
                            fieldId: 'custcol_sr_is_pmo',
                            value: false
                        });
                    }
                }
            }
            log.debug('End Script');
        }

        return func;

    });
