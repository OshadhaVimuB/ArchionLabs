/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Users, Paintbrush } from 'lucide-react';
import { RoleConfig } from '@/types/simulation';

interface RoleConfiguratorProps {
  roles: RoleConfig[];
  setRoles: React.Dispatch<React.SetStateAction<RoleConfig[]>>;
  activeRoleId: string | null;
  setActiveRoleId: (id: string | null) => void;
  onStartSimulation: () => void;
}

export default function RoleConfigurator({
  roles,
  setRoles,
  activeRoleId,
  setActiveRoleId,
  onStartSimulation
}: RoleConfiguratorProps) {
  const updateRole = (id: string, updates: Partial<RoleConfig>) => {
    setRoles(roles.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  return (
    <div className="absolute top-24 left-6 z-10 w-80 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-foreground pointer-events-auto">
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
         <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <Users size={18} className="text-primary" />
            Role Configuration
         </h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto max-h-[60vh] flex flex-col gap-3 custom-scrollbar">
        {roles.map(role => (
          <div 
            key={role.id} 
            className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
              activeRoleId === role.id 
                ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(255,255,255,0.15)]' 
                : 'bg-secondary/50 border-transparent hover:border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 mr-2">
                <input 
                  type="color" 
                  value={role.color}
                  onChange={(e) => updateRole(role.id, { color: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20 p-0 flex-shrink-0"
                  title="Change color"
                />
                <input 
                  type="text" 
                  value={role.name}
                  onChange={(e) => updateRole(role.id, { name: e.target.value })}
                  className="bg-background border border-border rounded px-2 py-1 text-foreground font-medium focus:outline-none focus:border-primary w-full text-sm"
                  placeholder="Agent Name"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
               <span>Agent</span>
               <span>{role.areas.length} cells painted</span>
            </div>

            <button
               onClick={() => setActiveRoleId(activeRoleId === role.id ? null : role.id)}
               className={`mt-2 py-1.5 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                 activeRoleId === role.id
                   ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                   : 'bg-secondary text-secondary-foreground hover:bg-muted'
               }`}
            >
               <Paintbrush size={14} />
               {activeRoleId === role.id ? 'Done Painting' : 'Paint Accessible Area'}
            </button>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border bg-card">
         <p className="text-xs text-muted-foreground mb-3 text-center leading-relaxed">
            Paint areas on the floor grid below for the active role. Unpainted roles can access the entire building.
         </p>
         <button
           onClick={onStartSimulation}
           disabled={roles.length === 0}
           className="w-full bg-primary hover:bg-primary/90 disabled:bg-secondary disabled:text-muted-foreground disabled:cursor-not-allowed text-primary-foreground py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
         >
           Start Simulation
         </button>
      </div>
    </div>
  );
}
