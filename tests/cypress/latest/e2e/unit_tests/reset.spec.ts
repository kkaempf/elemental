/*
Copyright © 2022 - 2023 SUSE LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import '~/support/commands';
import filterTests from '~/support/filterTests.js';
import * as cypressLib from '@rancher-ecp-qa/cypress-library';
import { qase } from 'cypress-qase-reporter/dist/mocha';

filterTests(['main'], () => {
  Cypress.config();
  describe('Reset testing', () => {
    const clusterName   = "mycluster"
    const elementalUser = "elemental-user"
    const k8sVersion    = Cypress.env('k8s_version');
    const proxy         = "http://172.17.0.1:3128" 
    const uiAccount     = Cypress.env('ui_account');
    const uiPassword    = "rancherpassword"
  
    beforeEach(() => {
      (uiAccount == "user") ? cy.login(elementalUser, uiPassword) : cy.login();
      cy.visit('/');
      cypressLib.burgerMenuOpenIfClosed();
      cypressLib.accesMenu('OS Management');
    });
  
    qase(2,
      it('Reset node by deleting the cluster', () => {
        cy.viewport(1920, 1080);
        //cypressLib.burgerMenuOpenIfClosed();
        //cypressLib.accesMenu('OS Management');
        cy.getBySel('button-manage-elemental-clusters').click();
        cy.getBySel('sortable-cell-0-0').click();
        cy.clickButton('Delete');
        cy.getBySel('prompt-remove-input')
          .type('mycluster');
        cy.getBySel('prompt-remove-confirm-button').click();
        cypressLib.burgerMenuOpenIfClosed();
        cypressLib.accesMenu('OS Management');
        cy.clickNavMenu(["Inventory of Machines"]);
        cy.contains('There are no rows to show.');
        cy.getBySel('sortable-table-0-row', { timeout: 180000 })
          .contains('Active', { timeout: 180000 });
    }));

    it('Create Elemental cluster', () => {
      cy.getBySel('button-create-elemental-cluster')
        .click();
      cy.getBySel('name-ns-description-name')
        .type(clusterName);
      cy.getBySel('name-ns-description-description')
        .type('My Elemental testing cluster');
      cy.contains('Show deprecated Kubernetes')
        .click();
      cy.contains('Kubernetes Version')
        .click();
      cy.contains(k8sVersion)
        .click();
      // Configure proxy if proxy is set to elemental
      if ( Cypress.env('proxy') == "elemental") {
        cy.contains('Agent Environment Vars')
          .click();
        cy.get('#agentEnv > .key-value')
          .contains('Add')
          .click();
        cy.get('.key > input')
          .type('HTTP_PROXY');
        cy.get('.no-resize')
          .type(proxy);
        cy.get('#agentEnv > .key-value')
          .contains('Add')
          .click();
        cy.get(':nth-child(7) > input')
          .type('HTTPS_PROXY');
        if (isRancherManagerVersion('-head')) {
          cy.get(':nth-child(8) > > [data-testid="text-area-auto-grow"]').type(proxy);
        } else {
          cy.get(':nth-child(8) > .no-resize').type(proxy);
        }
        cy.get('#agentEnv > .key-value')
          .contains('Add')
          .click();
        cy.get(':nth-child(10) > input')
          .type('NO_PROXY');
        if (isRancherManagerVersion('-head')) {
          cy.get(':nth-child(11) > > [data-testid="text-area-auto-grow"]')
            .type('localhost,127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local');
        } else {
          cy.get(':nth-child(11) > .no-resize')
          .type('localhost,127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,.svc,.cluster.local');
        }
      }
      cy.clickButton('Create');
      // This wait can be replaced by something cleaner
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(3000);
      cypressLib.checkClusterStatus(clusterName, 'Updating', 300000);
      cypressLib.checkClusterStatus(clusterName, 'Active', 600000);
      // Ugly but needed unfortunately to make sure the cluster stops switching status
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(240000);
    })
  });
});