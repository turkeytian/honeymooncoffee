/*jslint browser: true, sloppy: true, unparam: true, vars: true, white: false, indent: 2 */
/*global jQuery: false, $: false, CMN: false, Modernizr: false */
CMN.namespace("fta.search");

CMN.fta.search = (function () {
  //---------------------------------------------------------------------------
  // Private variables
  //---------------------------------------------------------------------------

  var addressCache = {};

  //---------------------------------------------------------------------------
  // Private functions
  //---------------------------------------------------------------------------

  function addressLookup(id) {
    $(id).autocomplete({
      delay     : 100,
      autoFocus : true,
      minLength : 1,
      source    : function (request, response) {
        var term = request.term;
        if (addressCache[term]) {
          response(addressCache[term]);
          return;
        }

        request.rm = 'addressLookup';
        request.type = id;

        $("#saAddAddress").prop('checked', false);
        $("#saAddAddress").button('refresh');
        $("#saAdd").hide();
        $("#infoStatus").slideUp();
        $(id).removeClass('error');
        $("#saNoteId").hide();

        CMN.core.makeRequest(
          request,
          function (data, success) {
            var map = {};
            if (success && data.results.length > 0) {
              map = $.map(data.results, function (item) {
                return ({
                  label: item.address,
                  value: item.address,
                  wireless: item.wireless,
                  metrozoneName: item.metrozoneName,
                  addressCode: item.addressCode,
                  businessAgreementName: item.businessAgreementName
                });
              });

              addressCache[term] = map;
            } else if (success && id === "#spatialAddress") {
              if (data.addressStatus !== 0) {
                if (data.addressStatus === 4) {
                  $("#saAdd").show();
                  CMN.oe.common.displayInfoMessage(
                    data.addressMessage,
                    { displayTime : 0 }
                  );
                } else if (data.addressStatus === 5) {
                  handleMultipleAddressMatches(data, id);
                } else {
                  if (data.addressMessage) {
                    $(id).addClass('error');
                    CMN.oe.common.displayInfoMessage(
                      data.addressMessage,
                      { displayTime : 0 }
                    );
                  }
                }
              }
            }

            response(map);
          },
          function () {
            $(id).autocomplete("search", $(id).val());
          }
        );
      }
    });
  }



  //---------------------------------------------------------------------------
  // Public functions
  //---------------------------------------------------------------------------
  return {

    notesLookup : function () {

      /*

      if ($.fn.DataTable.isDataTable('.searchResults table')) {
        $('.searchResults table').DataTable().clear();
      }
      $('div.searchResults').hide();

      if (!CMN.core.util.validateFields({ 'container' : '.subSearch.panel' })) {
        return false;
      }

      */

      var flag = false;
      $('.notesSearch [data-send]').each(function () {
        if ($(this).val().length > 0) {
          flag = true;
          return false;
        }
      });

      if (!flag) {
        CMN.core.error.show({
          'message'     : "At least one field must have a value in order " +
            "to perform a search.",
          'displayTime' : 30
        });
        return false;
      }

      var info = CMN.core.util.getParameters({
        'container' : '.notesSearch'
      });

      if(info.activityID.value.length > 0) {
        info.IDType = {
          'id' : "IDType",
          'value' : "activityID"
        };

        info.ID = {
          'id' : "ID",
          'value' : info.activityID.value
        };
      }

      else {
        info.IDType = {
          'id' : "IDType",
          'value' : "subscriberID"
        };

        info.ID = {
          'id' : "ID",
          'value' : info.subscriberID.value
        };
      }

      info.subscriberID = null;
      delete info.subscriberID;
      info.activityID = null;
      delete info.activityID; 

      CMN.core.makeRequest2({
        'data' : {
          rm  : 'notesLookup',
          i   : JSON.stringify(info)
        },
        'modal' : true,
        'complete' : function (response) {

          if (response.data.resultCode === -2) {
            CMN.core.util.highlightErrors(response.data.fields);
            return false;
          }

          if (response.data.resultCode === 1) {
            if (response.data.uri) {
              CMN.core.modal.show();
              window.location = response.data.uri;

              return false;
            }

            if (
              response.data.results
                && response.data.results.length === 0
            ) {
              CMN.core.error.show({
                'message'     : response.data.error.message,
                'displayTime' : 30
              });

              return false;
            }

            var results;

            if (!response.data.results.subscriber_id)
              results = "<p><strong>Subscriber/Activity ID does not exist!</strong></p>";
            else {
              results = "<p><strong>Subscriber ID: " + response.data.results.subscriber_id + "</strong></p>";
              $.each(response.data.results.notes_record, function (index) {
                results += "<br>";
                results += "<p><strong>Activity ID:</strong> " + this.activity_id + "<br>";
                if(!this.date) this.date = "N/A";
                results += "<strong>Date</strong>: " + this.date + "<br>";
                if(!this.worktype) this.worktype = "N/A";
                results += "<strong>Work type:</strong> " + this.worktype + "<br>";
                if(!this.order_notes) this.order_notes = "N/A";
                results += "<strong>Order notes:</strong> " + this.order_notes + "<br>";
                if(!this.notes) this.notes = "N/A";
                results += "<strong>Notes:</strong> " + this.notes + "</p>";
              });
            }

            $('#notesLookupResults .notes_records').html(results);
            $('#notesLookupResults').foundation('open');

          }
        },
        'restart' : CMN.fta.search.notesLookup
      });
    },

    spatialLookup : function () {

      /*

      if ($.fn.DataTable.isDataTable('.searchResults table')) {
        $('.searchResults table').DataTable().clear();
      }
      $('div.searchResults').hide();

      if (!CMN.core.util.validateFields({ 'container' : '.subSearch.panel' })) {
        return false;
      }

      */

      var flag = false;
      $('.spatialSearch [data-send]').each(function () {
        if ($(this).val().length > 0) {
          flag = true;
          return false;
        }
      });

      if (!flag) {
        CMN.core.error.show({
          'message'     : "At least one field must have a value in order " +
            "to perform a search.",
          'displayTime' : 30
        });
        return false;
      }

      var info = CMN.core.util.getParameters({
        'container' : '.spatialSearch'
      });

      CMN.core.makeRequest2({
        'data' : {
          rm  : 'spatialLookup',
          i   : JSON.stringify(info)
        },
        'modal' : true,
        'complete' : function (response) {

          CMN.core.log(response.data);

          if (response.data.resultCode === -2) {
            CMN.core.util.highlightErrors(response.data.fields);
            return false;
          }

          if (response.data.resultCode === 1) {
            if (response.data.uri) {
              CMN.core.modal.show();
              window.location = response.data.uri;

              return false;
            }

            if (
              response.data.results
                && response.data.results.length === 0
            ) {
              CMN.core.error.show({
                'message'     : response.data.error.message,
                'displayTime' : 30
              });

              return false;
            }

            if(response.data.results.spatial) {
              $('.spatialInfo').val(response.data.results.spatial);
            }
            else {
              $('.spatialInfo').val("Spatial not available");
            }

          }
        },
        'restart' : CMN.fta.search.spatialLookup
      });
    },

    begin : function () {
      
      addressLookup('#spatialAddress');
    
      //------------------------------------------------------------
      // Deavtivates the other input bar when user selects Sub ID or 
      // activity ID for previous nots lookup
      //------------------------------------------------------------
      $("input#notesSearchSubscriber").on('input', function () {
        if($(this).val().length > 0) {
          $("input#notesSearchActivity").val("");
          $("input#notesSearchActivity").attr("readonly", true);
        }
        else {
          $("input#notesSearchActivity").attr("readonly", false);
        }
      });
      $("input#notesSearchActivity").on('input', function () {
        if($(this).val().length > 0) {
          $("input#notesSearchSubscriber").val("");
          $("input#notesSearchSubscriber").attr("readonly", true);
        }
        else {
          $("input#notesSearchSubscriber").attr("readonly", false);
        }
      });
  
    },

    end : function () {
      return;
    }
  };

}());

$(document).ready(CMN.fta.search.begin);
$(window).unload(CMN.fta.search.end);
