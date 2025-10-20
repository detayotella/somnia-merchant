'use client';

import { AlertCircle, ExternalLink } from 'lucide-react';
import { FACTORY_ADDRESS } from '../lib/constants';

export function DeploymentNotice() {
  const isDeployed = FACTORY_ADDRESS !== '0x0000000000000000000000000000000000000000';

  if (isDeployed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-6 mb-6">
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />
      <div className="relative flex items-start gap-4">
        <div className="flex-shrink-0 rounded-lg bg-yellow-500/20 p-2">
          <AlertCircle className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-yellow-300 mb-2">
            Contract Not Yet Deployed
          </h3>
          <p className="text-sm text-yellow-100/80 mb-4">
            The MerchantFactory contract exceeds the 24KB size limit and needs to be optimized before deployment.
            The development team is working on refactoring the contract to reduce its size.
          </p>
          <div className="space-y-2 text-sm text-yellow-100/60">
            <p><strong>Issue:</strong> Contract bytecode is 27.9KB (limit: 24KB)</p>
            <p><strong>Solution:</strong> Splitting contract into libraries and using external contracts</p>
            <p><strong>Status:</strong> In progress - estimated completion within 24 hours</p>
          </div>
          <div className="mt-4 pt-4 border-t border-yellow-500/20">
            <p className="text-xs text-yellow-100/60">
              You can still explore the UI and see how the system works. 
              Once deployed, you&apos;ll be able to create your own AI-powered merchant NPCs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
