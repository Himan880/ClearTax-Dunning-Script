/**
 * @NApiVersion 2.0
 * @NScriptName Generate E-way Bill for Non IRN
 * @NScriptType usereventscript
 *
 * @NModuleScope Public
 */
define([
    "N/search",
    "N/runtime",
    "N/redirect",
    "N/ui/serverWidget",
   
    "N/error",
    "N/url",
  "N/record"
], function (
    search,
   runtime,
    redirect,
    serverWidget,
    error,
    url,record
) {
   

    function beforeLoad(context) {
        var currRecord = context.newRecord;
         if (context.type === context.UserEventType.VIEW) {
              var form = context.form;
			  var customerId = currRecord.getValue({
				  fieldId : 'entity'
			  });
			  var ewaybillNumber = currRecord.getValue({
				  fieldId : 'custbody_in_eway_bill_no'
			  });
			  var objCustomerRec  = record.load({
				  type : 'customer',
				  id : customerId
			  });
			  var regType = objCustomerRec.getValue({
				  fieldId : 'custentity_in_gst_vendor_regist_type'
			  });
           var i_recType = currRecord.type;//Get record type
                //log.debug('i_recType : ', i_recType);

                var i_recId = currRecord.id;//Get record id
                log.debug('i_recId : ', i_recId); 
			  if(regType == 4 && (ewaybillNumber == "" ||  ewaybillNumber == null)){
				  var output = url.resolveScript({scriptId: 'customscript_sl_generate_e_way_bill_for_', deploymentId: 'customdeploy_sl_generate_e_way_bill_for_',returnExternalUrl: false});                 
                    var url1 = output + '&i_recType=' +i_recType+ '&i_recId=' +i_recId;
                    
                    var path ="win = window.open('"+ url1 +"','_self')";
				  form.addButton({id : 'custpage_non_irn_ewaybill',label : 'Generate Non-IRN Eway Bill' , functionName : path});
			  }
			  
			  
			  				
			 
		 }
		 
			   
			  
			
  

  
   
   
   
    }
   

    
    return {
        beforeLoad: beforeLoad
    };
});