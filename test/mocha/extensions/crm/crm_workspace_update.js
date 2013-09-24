/*jshint trailing:true, white:true, indent:2, strict:true, curly:true,
  immed:true, eqeqeq:true, forin:true, latedef:true,
  newcap:true, noarg:true, undef:true, expr: true */
/*global XT:true, XM:true, XV:true, describe:true, it:true,
  before:true, beforeEach: true, afterEach: true, module:true,
  require:true, enyo:true, console:true, setTimeout:true */

(function () {
  "use strict";

  var _ = require("underscore"),
    zombieAuth = require("../../lib/zombie_auth"),
    smoke = require("../../lib/smoke"),
    common = require("../../lib/common"),
    assert = require("chai").assert,
    testData = [
      //{kind: "XV.HonorificList", model: "XM.Honorific", update: "code"},
      {kind: "XV.AccountList", model: "XM.Account", update: "name"},
      {kind: "XV.OpportunityList", model: "XM.Opportunity", update: "name"},
      {kind: "XV.ContactList", model: "XM.Contact", update: "firstName"},
      {kind: "XV.ToDoList", model: "XM.ToDo", update: "notes"},
      {kind: "XV.IncidentList", model: "XM.Incident", update: "notes"}
    ];

  describe('CRM Workspaces', function () {

    before(function (done) {
      this.timeout(30 * 1000);
      zombieAuth.loadApp(done);
    });

    describe('Update tests', function () {
      _.each(testData, smoke.updateFirstModel);
    });

    describe('Model Locking', function () {
      // XXX putting this here for now, but should probably generalize to test
      // all lockable models at once

      /**
        * Test the INCDT-19869 fix.
        * http://www.xtuple.org/xtincident/view/default/19869
        */
      describe('INCDT-19869: Lock not released when "New" is tapped in workspace', function () {
        var workspace, container, model, id;

        beforeEach(function (done) {
          this.timeout(30 * 1000);

          smoke.navigateToExistingWorkspace(XT.app, "XV.IncidentList", function (_workspace) {
            assert.notEqual(container, XT.app.$.postbooks.getActive());
            container = XT.app.$.postbooks.getActive();

            assert.isDefined(_workspace);
            assert.isDefined(_workspace.getValue());
            assert.isDefined(container);
            assert.isDefined(container.$.workspace);

            assert.equal(_workspace, container.$.workspace);

            workspace = _workspace;
            id = workspace.getValue().id;
            model = workspace.getValue();
            //model = XM.IncidentListItem.findOrCreate({ id: id });

            assert.isTrue(model.hasLockKey());
            assert.isFalse(model.isNew());

            done();
          });
        });
        afterEach(function (done) {
          this.timeout(5 * 1000);

          // maybe one of the tests already released the lock
          if (!model.hasLockKey()) {
            done();
            return;
          }
          model.on("lockChange", function () {
            model.off("lockChange");
            assert.isFalse(model.hasLockKey());
            // XXX solves inexplicable race condition
            setTimeout(function () {
              done();
            }, 3000);
          });
          container.close();
        });
        it('test base case', function () {

        });
        it('test "New" button', function (done) {
          model.on("lockChange", function () {
            model.off("lockChange");
            assert.isFalse(model.hasLockKey());
            done();
          });
          container.saveAndNew();
        });
      });
    });
  });
}());