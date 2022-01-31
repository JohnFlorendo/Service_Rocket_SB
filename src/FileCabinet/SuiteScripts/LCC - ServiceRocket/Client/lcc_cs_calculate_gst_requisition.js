/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

/*
ID : customscript_lcc_cs_calculate_gst
Name : LCC CS Calculate GST Requisition
Purpose : This script is used to calculate the GST Amount
Created On : August 4, 2021
Author : Ceana Technology
Script Type : Client Script
Saved Searches : NONE
*/

define(['N/search'], function (search) {

    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        if (context.sublistId == 'item') {
            if (context.fieldId == 'custpage_gst_code') {
                var intGSTCode = currentRecord.getCurrentSublistValue('item', 'custpage_gst_code');
                var stRate = parseFloat(getTaxCodeRate(intGSTCode)) || parseFloat(getTaxGroupRate(intGSTCode)) || 0;
                currentRecord.setCurrentSublistValue('item', 'custcol_gst', stRate);
                currentRecord.setCurrentSublistValue('item', 'custcol_gst_taxcode', intGSTCode);
            }

            if (context.fieldId == 'custcol_gst' || context.fieldId == 'estimatedrate' || context.fieldId == 'quantity') {
                var flEstimatedAmount = parseFloat(currentRecord.getCurrentSublistValue('item', 'estimatedamount')) || 0;
                var flTaxRate = parseFloat(currentRecord.getCurrentSublistValue('item', 'custcol_gst')) || 0;
                var flGSTAmount = parseFloat(parseFloat(flEstimatedAmount) * parseFloat(parseFloat(flTaxRate) / 100));
                var inEstimatedRate = parseFloat(currentRecord.getCurrentSublistValue('item', 'estimatedrate'));

                currentRecord.setCurrentSublistValue('item', 'custcol_gst_amount', flGSTAmount);
                // currentRecord.setCurrentSublistValue('item','custcol_gst_total_amount', flEstimatedAmount+flGSTAmount);
                currentRecord.setCurrentSublistValue('item', 'rate', inEstimatedRate);
                currentRecord.setCurrentSublistValue('item', 'amount', flEstimatedAmount + flGSTAmount);
            }
        }
    }

    function getTaxCodeRate(intGSTCodeId) {
        var flTaxRate = 0;
        if (!intGSTCodeId) {
            return flTaxRate;
        }

        var salestaxitemSearchObj = search.create({
            type: "salestaxitem",
            filters: ["internalid", "is", intGSTCodeId],
            columns: [search.createColumn({name: "rate", label: "Rate"})]
        });
        var searchResultCount = salestaxitemSearchObj.runPaged().count;
        if (searchResultCount != 0) {
            salestaxitemSearchObj.run().each(function (result) {
                flTaxRate = result.getValue({name: "rate"});
                return true;
            });
        }

        return flTaxRate;
    }

    function getTaxGroupRate(intGSTCodeId) {
        var flTaxGroup = 0;
        if (!intGSTCodeId) {
            return flTaxGroup;
        }

        var salestaxitemSearchObj = search.create({
            type: "taxgroup",
            filters: ["internalid", "is", intGSTCodeId],
            columns: [search.createColumn({name: "rate", label: "Rate"})]
        });
        var searchResultCount = salestaxitemSearchObj.runPaged().count;
        if (searchResultCount != 0) {
            salestaxitemSearchObj.run().each(function (result) {
                flTaxGroup = result.getValue({name: "rate"});
                return true;
            });
        }

        return flTaxGroup;
    }

    return {
        fieldChanged: fieldChanged
    };
});