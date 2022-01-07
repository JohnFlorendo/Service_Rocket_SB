/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*
ID : customscript_lcc_cs_calculate_gst_ss
Name : LCC CS Calculate GST Spend Schedule
Purpose : This script is used to calculate the GST Amount
Created On : August 31, 2021
Author : Ceana Technology
Script Type : Client Script
Saved Searches : NONE
*/

define(['N/search'], function(search) {

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        if(context.fieldId == 'custrecord_ct_gst_code') {
            var intGSTCode = currentRecord.getValue("custrecord_ct_gst_code");
            var stRate =  parseFloat(getTaxCodeRate(intGSTCode)) || parseFloat(getTaxGroupRate(intGSTCode)) || 0;
            currentRecord.setValue('custrecord_ct_gst_rate', stRate);
        }

        if(context.fieldId == 'custrecord_ct_gst_rate' || context.fieldId == 'custrecord_sr_sp_sch_amount') {
            var flAmount = parseFloat(currentRecord.getValue('custrecord_sr_sp_sch_amount')) || 0;
            var flTaxRate = parseFloat(currentRecord.getValue('custrecord_ct_gst_rate')) || 0;
            var flGSTAmount = parseFloat(parseFloat(flAmount)*parseFloat(parseFloat(flTaxRate)/100))
            currentRecord.setValue('custrecord_ct_gst_amount', flGSTAmount);
            currentRecord.setValue('custrecord_ct_total_spend_amount', flAmount+flGSTAmount);
        }
    }

    function getTaxCodeRate(intGSTCodeId) {
        var flTaxRate = 0;
        if(!intGSTCodeId) { return flTaxRate; }

        var salestaxitemSearchObj = search.create({
            type: "salestaxitem",
            filters: ["internalid","is",intGSTCodeId],
            columns: [search.createColumn({name: "rate", label: "Rate"})]
        });
        var searchResultCount = salestaxitemSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            salestaxitemSearchObj.run().each(function(result){
                flTaxRate = result.getValue({name: "rate"});
                return true;
            });
        }

        return flTaxRate;
    }

    function getTaxGroupRate(intGSTCodeId) {
        var flTaxGroup = 0;
        if(!intGSTCodeId) { return flTaxGroup; }

        var salestaxitemSearchObj = search.create({
            type: "taxgroup",
            filters: ["internalid","is",intGSTCodeId],
            columns: [search.createColumn({name: "rate", label: "Rate"})]
        });
        var searchResultCount = salestaxitemSearchObj.runPaged().count;
        if(searchResultCount != 0) {
            salestaxitemSearchObj.run().each(function(result){
                flTaxGroup = result.getValue({name: "rate"});
                return true;
            });
        }

        return flTaxGroup;
    }

    return { fieldChanged: fieldChanged };
});