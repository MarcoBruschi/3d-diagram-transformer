'use client';

import React from 'react';
import { AuthModal } from './AuthModal';
import { BillingModal } from './BillingModal';
import { ShareModal } from './ShareModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import { ExportModal } from './ExportModal';
import { TemplatesModal } from './TemplatesModal';
import { ArchitectureDiffModal } from './ArchitectureDiffModal';
import { IaCSyncModal } from './IaCSyncModal';
import { ADRGeneratorModal } from './ADRGeneratorModal';
import { ApiKeyGatewayModal } from './ApiKeyGatewayModal';
import { PluginsModal } from './PluginsModal';
import { WebXRModal } from './WebXRModal';
import { EnterpriseSettingsModal } from './EnterpriseSettingsModal';
import { NodeCommentsModal } from './NodeCommentsModal';
import { OpenDiagramModal } from './OpenDiagramModal';
import { TeamWorkspaceModal } from './TeamWorkspaceModal';

export function SaaSModalsHub() {
  return (
    <>
      <AuthModal />
      <BillingModal />
      <ShareModal />
      <VersionHistoryModal />
      <ExportModal />
      <TemplatesModal />
      <ArchitectureDiffModal />
      <IaCSyncModal />
      <ADRGeneratorModal />
      <ApiKeyGatewayModal />
      <PluginsModal />
      <WebXRModal />
      <EnterpriseSettingsModal />
      <NodeCommentsModal />
      <OpenDiagramModal />
      <TeamWorkspaceModal />
    </>
  );
}
