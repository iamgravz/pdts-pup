import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Truck, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Trash2, 
  Calendar, 
  Filter, 
  Check, 
  Inbox, 
  ChevronRight, 
  RefreshCw, 
  FileSpreadsheet, 
  BookOpen, 
  Settings,
  HelpCircle,
  X,
  FileCheck,
  Lock,
  Unlock,
  LogIn,
  LogOut,
  ShieldCheck,
  Users,
  Sliders,
  ListChecks,
  Pencil,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';

import { PurposeType, DeliveryMethodType, DocumentChecklistItem, PUPSubmission, SimulatedEmail, UserAccount, UserRole, AuditLogEntry, AuditActionType } from './types';
import { DEFAULT_CHECKLISTS, INITIAL_SAMPLE_SUBMISSIONS, INITIAL_SAMPLE_EMAILS } from './data';
import PUPLogo from './components/PUPLogo';

import ProcessSlip from './components/ProcessSlip';
import EmailTemplateView from './components/EmailTemplateView';
import PUPDatePicker from './components/PUPDatePicker';
import { apiFetch } from './lib/api';

// School-year aware tracking number setup.
// Auto mode: year changes when the configured school-year start month is reached.
// Manual mode: set VITE_SCHOOL_YEAR_START_YEAR in .env, for example 2026 for SY 2026-2027.
const SCHOOL_YEAR_START_MONTH = Number(import.meta.env.VITE_SCHOOL_YEAR_START_MONTH || 6);
const MANUAL_SCHOOL_YEAR_START_YEAR = import.meta.env.VITE_SCHOOL_YEAR_START_YEAR
  ? Number(import.meta.env.VITE_SCHOOL_YEAR_START_YEAR)
  : null;

function getSchoolYearStartYear(date: Date = new Date()): number {
  if (MANUAL_SCHOOL_YEAR_START_YEAR && !Number.isNaN(MANUAL_SCHOOL_YEAR_START_YEAR)) {
    return MANUAL_SCHOOL_YEAR_START_YEAR;
  }

  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return month >= SCHOOL_YEAR_START_MONTH ? year : year - 1;
}

function getSchoolYearLabel(date: Date = new Date()): string {
  const startYear = getSchoolYearStartYear(date);
  return `${startYear}-${startYear + 1}`;
}

function generateSchoolYearTrackingNumber(date: Date = new Date()): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';

  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `PUPOUS-${getSchoolYearStartYear(date)}-${randomStr}`;
}

export default function App() {
  // --- Authentication State (RBAC) ---
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('pup_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Password Recovery States ---
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [isRecoveryLoading, setIsRecoveryLoading] = useState(false);

  // --- Database Users State ---
  const [dbUsers, setDbUsers] = useState<UserAccount[]>([]);

  // --- Admin Settings Sub-Tab and Forms ---
  const [adminSettingsSubTab, setAdminSettingsSubTab] = useState<'checklists' | 'users' | 'email-templates'>('checklists');
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Registrar Officer');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);
  const [userCreationError, setUserCreationError] = useState('');
  const [userCreationSuccess, setUserCreationSuccess] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // --- Customizable Email Template States ---
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState('[PUP OUS] Document Requirements Received - {trackingId}');
  const [emailBodyTemplate, setEmailBodyTemplate] = useState('');
  const [emailTemplateSaveSuccess, setEmailTemplateSaveSuccess] = useState('');
  const [emailTemplateSaveError, setEmailTemplateSaveError] = useState('');
  const [isSavingEmailTemplate, setIsSavingEmailTemplate] = useState(false);

  // --- User Deletion States ---
  const [userDeletionError, setUserDeletionError] = useState('');
  const [userDeletionSuccess, setUserDeletionSuccess] = useState('');
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // --- Persistent States ---
  const [submissions, setSubmissions] = useState<PUPSubmission[]>([]);
  const [simulatedEmails, setSimulatedEmails] = useState<SimulatedEmail[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [dbLoading, setDbLoading] = useState(false);

  // --- Layout/Navigation States ---
  const [activeTab, setActiveTab] = useState<'log' | 'ledger' | 'audit' | 'admin-settings' | 'account'>('log');
  const [systemTime, setSystemTime] = useState(new Date());
  const [loginBackgroundIndex] = useState(() => Math.floor(Math.random() * 8) + 1);  const [checklistTemplates, setChecklistTemplates] = useState<{ id: string; purpose: PurposeType; name: string; required: boolean }[]>([]);
 
  // --- Change Password States ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [confirmAccountPassword, setConfirmAccountPassword] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');
  const [changePasswordError, setChangePasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewAccountPassword, setShowNewAccountPassword] = useState(false);
  const [showConfirmAccountPassword, setShowConfirmAccountPassword] = useState(false);

  // --- Form States (Tablet-optimized) ---
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType>('Admission - Graduation');
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentMiddleName, setStudentMiddleName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethodType>('Walk-in');
  const [courierTracking, setCourierTracking] = useState('');
  const [remarks, setRemarks] = useState('');
  const [checklist, setChecklist] = useState<DocumentChecklistItem[]>([]);
  const [customDocName, setCustomDocName] = useState('');

  // --- Active Student Checklist Inline CRUD States ---
  const [editingActiveChecklistIndex, setEditingActiveChecklistIndex] = useState<number | null>(null);
  const [editingActiveChecklistName, setEditingActiveChecklistName] = useState('');
  const [editingActiveChecklistRequired, setEditingActiveChecklistRequired] = useState(false);

  // --- Filters/Search States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPurpose, setFilterPurpose] = useState<string>('All');
  const [filterDelivery, setFilterDelivery] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [dateFilterType, setDateFilterType] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // --- Modal States ---
  const [selectedSubmissionForSlip, setSelectedSubmissionForSlip] = useState<PUPSubmission | null>(null);
  const [selectedSubmissionForEmail, setSelectedSubmissionForEmail] = useState<PUPSubmission | null>(null);
  const [newSubmissionSuccess, setNewSubmissionSuccess] = useState<PUPSubmission | null>(null);



  // --- Checklist Manager States ---
  const [managerSelectedPurpose, setManagerSelectedPurpose] = useState<PurposeType>('Admission - Graduation');
  const [newReqName, setNewReqName] = useState('');
  const [newReqRequired, setNewReqRequired] = useState(true);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqMessage, setReqMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Real-time clock update ---
  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  

  // --- Sync checklist with purpose changes ---
  useEffect(() => {
    const dynamicItems = checklistTemplates.filter(item => item.purpose === selectedPurpose);
    if (dynamicItems.length > 0) {
      setChecklist(dynamicItems.map(item => ({ name: item.name, checked: false, required: item.required })));
    } else {
      const defaults = DEFAULT_CHECKLISTS[selectedPurpose] || [];
      setChecklist(defaults.map(item => ({ ...item, checked: false })));
    }
  }, [selectedPurpose, checklistTemplates]);

  const fetchUsersFromDb = () => {
    apiFetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch database users');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setDbUsers(data);
        }
      })
      .catch(err => console.error('Error fetching users from DB:', err));
  };

  const fetchEmailTemplate = () => {
    apiFetch('/api/email-template/config')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch email template config');
        return res.json();
      })
      .then(data => {
        if (data.subjectFormat) setEmailSubjectTemplate(data.subjectFormat);
        if (data.bodyFormat) setEmailBodyTemplate(data.bodyFormat);
      })
      .catch(err => console.error('Error fetching email template:', err));
  };

  useEffect(() => {
    fetchUsersFromDb();
    fetchEmailTemplate();
  }, []);

  // --- Load Data from PostgreSQL Database ---
  useEffect(() => {
    if (currentUser) {
      setDbLoading(true);
      Promise.all([
        apiFetch('/api/submissions').then(res => {
          if (!res.ok) throw new Error('Failed to fetch submissions');
          return res.json();
        }),
        apiFetch('/api/emails').then(res => {
          if (!res.ok) throw new Error('Failed to fetch emails');
          return res.json();
        }),
        apiFetch('/api/audit').then(res => {
          if (!res.ok) throw new Error('Failed to fetch audit logs');
          return res.json();
        }),
        apiFetch('/api/checklist-templates').then(res => {
          if (!res.ok) throw new Error('Failed to fetch checklist templates');
          return res.json();
        })
      ])
      .then(([subData, emailData, auditData, checklistData]) => {
        if (Array.isArray(subData)) {
          setSubmissions(subData);
        }
        if (Array.isArray(emailData)) {
          setSimulatedEmails(emailData);
        }
        if (Array.isArray(auditData)) {
          setAuditLogs(auditData);
        }
        if (Array.isArray(checklistData)) {
          setChecklistTemplates(checklistData);
        }
      })
      .catch(err => {
        console.error('Error loading database tables:', err);
      })
      .finally(() => {
        setDbLoading(false);
      });
    }
  }, [currentUser]);

  // --- Handler functions ---

  const logAuditAction = async (action: AuditActionType, details: string, targetId?: string) => {
    if (!currentUser) return;
    
    const newLog: AuditLogEntry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      user: currentUser.username,
      role: currentUser.role,
      action,
      details,
      targetId
    };

    try {
      const res = await apiFetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      if (res.ok) {
        setAuditLogs(prev => [newLog, ...prev]);
      }
    } catch (err) {
      console.error('Failed to log audit action', err);
    }
  };

  // --- Requirement Checklist CRUD Handlers ---

  const handleCreateOrUpdateRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReqName.trim()) return;

    const body = {
      purpose: managerSelectedPurpose,
      name: newReqName.trim(),
      required: newReqRequired
    };

    try {
      if (editingReqId) {
        // Update existing item
        const res = await apiFetch(`/api/checklist-templates/${editingReqId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update requirement template item');
        
        // Refresh templates from DB
        const freshRes = await apiFetch('/api/checklist-templates');
        const freshData = await freshRes.json();
        setChecklistTemplates(freshData);

        logAuditAction('UPDATE', `Updated requirement "${body.name}" (${body.required ? 'Required' : 'Optional'}) for ${body.purpose}`, editingReqId);
        setReqMessage({ type: 'success', text: `Successfully updated requirement: "${body.name}"` });
        
        // Reset form
        setEditingReqId(null);
        setNewReqName('');
        setNewReqRequired(true);
      } else {
        // Create new item
        const res = await apiFetch('/api/checklist-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to create requirement template item');
        const data = await res.json();
        
        // Refresh templates from DB
        const freshRes = await apiFetch('/api/checklist-templates');
        const freshData = await freshRes.json();
        setChecklistTemplates(freshData);

        logAuditAction('CREATE', `Added requirement "${body.name}" (${body.required ? 'Required' : 'Optional'}) for ${body.purpose}`, data.item.id);
        setReqMessage({ type: 'success', text: `Successfully added requirement: "${body.name}"` });
        
        // Reset form
        setNewReqName('');
        setNewReqRequired(true);
      }
    } catch (err: any) {
      console.error('Error in handleCreateOrUpdateRequirement:', err);
      setReqMessage({ type: 'error', text: err.message || 'An error occurred while saving the requirement.' });
    }
  };

  const handleEditReqClick = (item: { id: string; purpose: PurposeType; name: string; required: boolean }) => {
    setEditingReqId(item.id);
    setNewReqName(item.name);
    setNewReqRequired(item.required);
    setManagerSelectedPurpose(item.purpose);
    setReqMessage(null);
  };

  const handleDeleteReqClick = async (id: string, name: string, purpose: string) => {
    if (!confirm(`Are you sure you want to delete the requirement "${name}" for ${purpose}?`)) return;

    try {
      const res = await apiFetch(`/api/checklist-templates/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete requirement template item');

      // Refresh templates from DB
      const freshRes = await apiFetch('/api/checklist-templates');
      const freshData = await freshRes.json();
      setChecklistTemplates(freshData);

      logAuditAction('DELETE', `Deleted requirement "${name}" from ${purpose}`, id);
      setReqMessage({ type: 'success', text: `Successfully deleted requirement: "${name}"` });

      if (editingReqId === id) {
        setEditingReqId(null);
        setNewReqName('');
        setNewReqRequired(true);
      }
    } catch (err: any) {
      console.error('Error in handleDeleteReqClick:', err);
      setReqMessage({ type: 'error', text: err.message || 'An error occurred while deleting.' });
    }
  };

  const handleCancelEdit = () => {
    setEditingReqId(null);
    setNewReqName('');
    setNewReqRequired(true);
    setReqMessage(null);
  };

  // Auth Handler functions
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoginLoading(true);

    try {
      const res = await apiFetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usernameInput,
          password: passwordInput
        })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('pup_current_user', JSON.stringify(data.user));
        setUsernameInput('');
        setPasswordInput('');
      } else {
        setLoginError(data.error || 'Invalid Username or password. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('Network error. Please try again later.');
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (newAccountPassword !== confirmAccountPassword) {
      setChangePasswordError('New passwords do not match.');
      return;
    }

    if (newAccountPassword.length < 6) {
      setChangePasswordError('New password must be at least 6 characters.');
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await apiFetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: currentUser.username,
          currentPassword,
          newPassword: newAccountPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setChangePasswordError(data.error || 'Failed to change password.');
      } else {
        setChangePasswordSuccess('Your password has been changed successfully.');
        setCurrentPassword('');
        setNewAccountPassword('');
        setConfirmAccountPassword('');
        
        // Update local state if the user object had a password field (it doesn't here, but good practice)
        if (currentUser.password) {
          const updatedUser = { ...currentUser, password: newAccountPassword };
          setCurrentUser(updatedUser);
          localStorage.setItem('pup_current_user', JSON.stringify(updatedUser));
        }

        logAuditAction('UPDATE', 'Changed account password', currentUser.username);
      }
    } catch (err: any) {
      setChangePasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');
    setIsRecoveryLoading(true);

    apiFetch('/api/users/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: recoveryEmail })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to request password recovery.');
        }
        return data;
      })
      .then(data => {
        setRecoverySuccess(data.message || 'Temporary password has been sent successfully! Please check your inbox or simulated logs.');
        setRecoveryEmail('');
        // Refresh emails in state
        apiFetch('/api/emails').then(r => r.json()).then(emails => {
          if (Array.isArray(emails)) setSimulatedEmails(emails);
        }).catch(err => console.error('Error refreshing emails:', err));
      })
      .catch(err => {
        setRecoveryError(err.message || 'Failed to process recovery.');
      })
      .finally(() => {
        setIsRecoveryLoading(false);
      });
  };

  const handleSaveEmailTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmailTemplate(true);
    setEmailTemplateSaveSuccess('');
    setEmailTemplateSaveError('');

    apiFetch('/api/email-template/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subjectFormat: emailSubjectTemplate,
        bodyFormat: emailBodyTemplate
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save email template.');
        return data;
      })
      .then(data => {
        setEmailTemplateSaveSuccess(data.message || 'Email template saved successfully!');
        logAuditAction('UPDATE', 'Updated system-wide student email body and subject templates.');
      })
      .catch(err => {
        console.error('Error saving template:', err);
        setEmailTemplateSaveError(err.message || 'Error occurred while saving email template.');
      })
      .finally(() => {
        setIsSavingEmailTemplate(false);
      });
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreationError('');
    setUserCreationSuccess('');
    
    if (newPassword !== newConfirmPassword) {
      setUserCreationError('Passwords do not match.');
      return;
    }
    
    setIsCreatingUser(true);

    apiFetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newUsername,
        fullName: newFullName,
        email: newEmail,
        role: newRole,
        password: newPassword,
        avatarUrl: ''
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to create user');
        }
        return data;
      })
      .then(data => {
        setUserCreationSuccess(data.message || 'Staff account registered successfully!');
        setNewUsername('');
        setNewFullName('');
        setNewEmail('');
        setNewPassword('');
        setNewConfirmPassword('');
        setNewRole('Registrar Officer');
        fetchUsersFromDb();

        // Write audit log entry
        const auditPayload = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser?.username || 'admin001',
          role: currentUser?.role || 'Head Admin',
          action: 'CREATE',
          details: `Registered new registrar staff account: ${newFullName} (${newUsername} - ${newRole})`,
          targetId: newUsername
        };

        apiFetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditPayload)
        })
          .then(res => res.json())
          .then(() => {
            apiFetch('/api/audit').then(r => r.json()).then(logs => {
              if (Array.isArray(logs)) setAuditLogs(logs);
            });
          })
          .catch(err => console.error('Error logging audit for user creation:', err));
      })
      .catch(err => {
        setUserCreationError(err.message || 'Failed to register staff account.');
      })
      .finally(() => {
        setIsCreatingUser(false);
      });
  };

  const handleDeleteUserClick = (user: UserAccount) => {
    setUserDeletionError('');
    setUserDeletionSuccess('');
    if (currentUser?.username === user.username) {
      setUserDeletionError('Security constraint: You cannot delete your own administrative account.');
      return;
    }
    // Prevent deleting preset admin001 to prevent lockouts during evaluation
    if (user.username === 'admin001') {
      setUserDeletionError('Constraint: The system primary admin account "admin001" cannot be deleted.');
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    setUserDeletionError('');
    setUserDeletionSuccess('');

    apiFetch(`/api/users/${encodeURIComponent(userToDelete.username)}`, {
      method: 'DELETE',
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to delete staff account');
        }
        return data;
      })
      .then(data => {
        setUserDeletionSuccess(data.message || `Staff account for "${userToDelete.fullName}" has been deleted.`);
        fetchUsersFromDb();

        // Write audit log entry
        const auditPayload = {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          user: currentUser?.username || 'admin001',
          role: currentUser?.role || 'Head Admin',
          action: 'DELETE' as AuditActionType,
          details: `Deleted registrar staff account: ${userToDelete.fullName} (${userToDelete.username} - ${userToDelete.role})`,
          targetId: userToDelete.username
        };

        apiFetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(auditPayload)
        })
          .then(res => res.json())
          .then(() => {
            apiFetch('/api/audit').then(r => r.json()).then(logs => {
              if (Array.isArray(logs)) setAuditLogs(logs);
            });
          })
          .catch(err => console.error('Error logging audit for user deletion:', err));

        setUserToDelete(null);
      })
      .catch(err => {
        setUserDeletionError(err.message || 'Failed to delete staff account.');
      })
      .finally(() => {
        setIsDeletingUser(false);
      });
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    localStorage.removeItem('pup_current_user');
  };

  // Checkbox togglers
  const handleToggleCheck = (index: number) => {
    const updated = [...checklist];
    updated[index].checked = !updated[index].checked;
    setChecklist(updated);
  };

  const handleToggleAll = (checkAll: boolean) => {
    const updated = checklist.map(item => ({ ...item, checked: checkAll }));
    setChecklist(updated);
  };

  const handleAddCustomDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDocName.trim()) return;
    
    // Add custom document to active list
    setChecklist([
      ...checklist,
      { name: customDocName.trim(), checked: true, required: false }
    ]);
    setCustomDocName('');
  };

  // --- Active Checklist Inline CRUD Handlers ---
  const handleDeleteActiveChecklistItem = (index: number) => {
    const updated = checklist.filter((_, idx) => idx !== index);
    setChecklist(updated);
    if (editingActiveChecklistIndex === index) {
      setEditingActiveChecklistIndex(null);
    }
  };

  const handleStartEditActiveChecklistItem = (index: number) => {
    setEditingActiveChecklistIndex(index);
    setEditingActiveChecklistName(checklist[index].name);
    setEditingActiveChecklistRequired(checklist[index].required);
  };

  const handleSaveActiveChecklistItem = (index: number) => {
    if (!editingActiveChecklistName.trim()) return;
    const updated = [...checklist];
    updated[index] = {
      ...updated[index],
      name: editingActiveChecklistName.trim(),
      required: editingActiveChecklistRequired
    };
    setChecklist(updated);
    setEditingActiveChecklistIndex(null);
  };

  const handleCancelEditActiveChecklistItem = () => {
    setEditingActiveChecklistIndex(null);
  };

  // Form Reset
  const handleResetForm = () => {
    setStudentFirstName('');
    setStudentMiddleName('');
    setStudentLastName('');
    setStudentEmail('');
    setContactNumber('');
    setDeliveryMethod('Walk-in');
    setCourierTracking('');
    setRemarks('');
    const defaults = DEFAULT_CHECKLISTS[selectedPurpose] || [];
    setChecklist(defaults.map(item => ({ ...item, checked: false })));
    setCustomDocName('');
  };

  // Compiled acknowledgement email template with embedded PUP logo support.
  // This version is intentionally clean and fixed for acknowledgement only.
  // It does not reuse legacy custom email body text to avoid duplicate tracking/details in the email.
  const compileEmailTemplate = (
  sub: PUPSubmission,
  checkedDocs: { name: string; checked: boolean; required: boolean }[],
  missingDocs: { name: string; checked: boolean; required: boolean }[],
  formattedDate: string,
  logoSrc: string = 'cid:pupLogo'
) => {
    const escapeHtml = (value?: string) => String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const safeStudentName = escapeHtml(sub.studentName);
    const safeTrackingId = escapeHtml(sub.id);
    const safePurpose = escapeHtml(sub.purpose);
    const safeSchoolYear = escapeHtml(`SY ${getSchoolYearLabel(new Date(sub.timestamp || Date.now()))}`);
    const safeDeliveryMethod = escapeHtml(sub.deliveryMethod);
    const safeCourier = sub.courierTrackingNumber ? escapeHtml(sub.courierTrackingNumber) : '';
    const safeReceivedDate = escapeHtml(formattedDate);
    const safeRemarks = sub.remarks && sub.remarks.trim() ? escapeHtml(sub.remarks) : '';

    const subject = `PUPOUS Document Submission Acknowledgement - ${safeTrackingId}`;

    const receivedDocumentsHtml = checkedDocs.length > 0
      ? checkedDocs.map(doc => `
          <li style="margin:0 0 6px 0; padding:0; color:#1f2937;">
            <span style="color:#047857; font-weight:bold;">✓</span> ${escapeHtml(doc.name)}
          </li>
        `).join('')
      : `<li style="margin:0; color:#6b7280; font-style:italic;">No document has been marked as received yet.</li>`;

    const pendingDocumentsHtml = missingDocs.length > 0
      ? missingDocs.map(doc => `
          <li style="margin:0 0 6px 0; padding:0; color:#7f1d1d;">
            <span style="color:#b91c1c; font-weight:bold;">•</span> ${escapeHtml(doc.name)}
          </li>
        `).join('')
      : `<li style="margin:0; color:#047857; font-weight:bold;">No pending required documents based on the current checklist.</li>`;

    const courierRow = safeCourier
      ? `
        <tr>
          <td style="padding:12px 14px; background-color:#f7eeee; border:1px solid #d9d9d9; font-weight:700; color:#7f0d0d; font-size:13px;">Courier / Reference No.</td>
          <td style="padding:12px 14px; border:1px solid #d9d9d9; font-size:13px; color:#111827;">${safeCourier}</td>
        </tr>`
      : '';

    const remarksBlock = safeRemarks
      ? `<div style="margin:18px 0 0 0; padding:14px 16px; border:1px solid #fde68a; background-color:#fffbeb; border-radius:6px;">
          <p style="margin:0 0 6px 0; font-size:14px; color:#92400e; font-weight:800;">Registrar's Remarks / Office Instructions</p>
          <p style="margin:0; font-size:13px; line-height:1.6; color:#78350f;">${safeRemarks}</p>
        </div>`
      : '';

    const body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PUPOUS Document Submission Acknowledgement</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:Arial, Helvetica, sans-serif; color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f4f6; padding:24px 0;">
    <tr>
      <td align="center" style="padding:0 12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:576px; background-color:#ffffff; border:1px solid #e5e7eb; border-radius:8px; border-collapse:separate; overflow:hidden;">

          <!-- Branding Banner (matches EmailTemplateView header) -->
          <tr>
            <td align="center" style="background-color:#800000; padding:24px 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto; border-collapse:collapse;">
                <tr>
                  <td style="vertical-align:middle; padding-right:14px;">
                    <img src="${logoSrc}" alt="PUP Logo" width="48" height="48" style="display:block; width:48px; height:48px; border:0; border-radius:50%; background:#ffffff;" />
                  </td>
                  <td style="vertical-align:middle; text-align:left;">
                    <p style="margin:0; font-size:13px; line-height:1.35; color:#ffffff; font-weight:800; letter-spacing:0.4px;">
                      POLYTECHNIC UNIVERSITY OF THE PHILIPPINES
                    </p>
                    <p style="margin:3px 0 0 0; font-size:10px; color:#ffffffe6; font-weight:600; letter-spacing:0.5px;">
                      OPEN UNIVERSITY SYSTEM &bull; ADMISSION RECORD MONITORING
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:20px 20px 18px 20px;">
              <p style="margin:0 0 14px 0; font-size:14px; line-height:1.6; color:#111827; font-weight:600;">
                Hello, <strong>${safeStudentName}</strong>!
              </p>

              <p style="margin:0 0 16px 0; font-size:13px; line-height:1.7; color:#374151;">
                This is an official verification that the PUP OUS Admission Office has received your academic documents for <strong>${safePurpose}</strong>.
              </p>

              <!-- Tracking Details (left-border accent box, like EmailTemplateView) -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 16px 0;">
                <tr>
                  <td style="background-color:#f9fafb; border-left:4px solid #800000; padding:12px 14px; border-radius:0 6px 6px 0;">
                    <span style="display:block; font-size:9px; text-transform:uppercase; font-weight:800; letter-spacing:0.6px; color:#9ca3af; margin-bottom:4px;">Tracking Details</span>
                    <p style="margin:0 0 3px 0; font-size:12px; color:#111827;">
                      <strong>Reference / Process Code:</strong>
                      <span style="font-family:'Courier New', monospace; font-size:13px; color:#800000; font-weight:800;">${safeTrackingId}</span>
                    </p>
                    <p style="margin:0 0 3px 0; font-size:12px; color:#111827;">
                      <strong>School Year:</strong> ${safeSchoolYear}
                    </p>
                    <p style="margin:0 0 3px 0; font-size:12px; color:#111827;">
                      <strong>Delivery Method:</strong> ${safeDeliveryMethod}
                      ${safeCourier ? `<span style="display:block; font-family:'Courier New', monospace; font-size:11px; color:#4b5563; background-color:#e5e7eb99; padding:2px 6px; border-radius:4px; width:fit-content; margin-top:3px;">Courier Ref: ${safeCourier}</span>` : ''}
                    </p>
                    <p style="margin:0; font-size:12px; color:#111827;">
                      <strong>Received Date:</strong> ${safeReceivedDate}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Received Documents -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 14px 0;">
                <tr>
                  <td>
                    <p style="margin:0 0 6px 0; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:#1f2937; border-bottom:1px solid #f3f4f6; padding-bottom:5px;">
                      &#10003; Received Documents:
                    </p>
                    <ul style="margin:0; padding-left:2px; list-style:none; font-size:12px; line-height:1.7;">
                      ${receivedDocumentsHtml}
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- Missing / Pending Documents -->
              ${missingDocs.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 14px 0;">
                <tr>
                  <td style="background-color:#fff1f2; border:1px solid #ffe4e6; border-radius:8px; padding:12px 14px;">
                    <p style="margin:0 0 6px 0; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.4px; color:#9f1239;">
                      &#9888; Pending Essential Requirements (Deficiencies):
                    </p>
                    <ul style="margin:0 0 8px 0; padding-left:2px; list-style:none; font-size:12px; line-height:1.7;">
                      ${pendingDocumentsHtml}
                    </ul>
                    <p style="margin:0; font-size:11px; color:#9f1239; font-style:italic; font-weight:600;">
                      Please submit the pending requirements as soon as possible to proceed with the processing of your application in the SIS.
                    </p>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Admin Remarks -->
              ${safeRemarks ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 14px 0;">
                <tr>
                  <td style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:8px; padding:12px 14px;">
                    <span style="display:block; font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; color:#92400e; margin-bottom:4px;">Office Remarks / Instructions:</span>
                    <p style="margin:0; font-size:12px; color:#78350f; font-style:italic; line-height:1.6;">&ldquo;${safeRemarks}&rdquo;</p>
                  </td>
                </tr>
              </table>` : ''}

              <!-- Guidance -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse; margin:0 0 4px 0;">
                <tr>
                  <td style="background-color:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; padding:12px 14px;">
                    <span style="display:block; font-size:11px; font-weight:800; color:#334155; margin-bottom:5px;">Guidelines and Next Steps:</span>
                    <p style="margin:0 0 5px 0; font-size:11.5px; color:#475569; line-height:1.6;">1. Your documents are now scheduled for physical folder verification.</p>
                    <p style="margin:0; font-size:11.5px; color:#475569; line-height:1.6;">2. The OUS Admin will now input your submission status into the <strong>PUP Student Information System (SIS)</strong>. Please monitor your official portal evaluation.</p>
                  </td>
                </tr>
                
              </table>

              
            </td>
          </tr>

          <!-- Footer (matches EmailTemplateView footer) -->
          <tr>
            <td style="padding:16px 20px; border-top:1px solid #f3f4f6; text-align:center;">
              <p style="margin:0; font-size:10px; font-weight:700; text-transform:uppercase; color:#6b7280; letter-spacing:0.3px;">
                Polytechnic University of the Philippines
              </p>
              <p style="margin:2px 0 0 0; font-size:10px; color:#9ca3af;">
                Anonas Street, Sta. Mesa, Manila, Philippines
              </p>
              <p style="margin:8px 0 0 0; font-size:10px; font-weight:800; color:#800000; font-family:'Courier New', monospace; letter-spacing:0.3px;">
                PLEASE DO NOT REPLY TO THIS EMAIL
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { subject, body };
  };

  // Form Submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (dbLoading) return;

    if (!studentFirstName.trim()) {
      alert('Please enter the Student First Name.');
      return;
    }
    if (!studentLastName.trim()) {
      alert('Please enter the Student Last Name.');
      return;
    }
    if (!studentEmail.trim()) {
      alert('Please enter the Email Address.');
      return;
    }
    if (!contactNumber.trim()) {
      alert('Please enter the Contact Number.');
      return;
    }

    // Generate a school-year aware tracking number.
    // Example: PUPOUS-2026-AB12C for SY 2026-2027.
    const trackingId = generateSchoolYearTrackingNumber(systemTime);
    const nowIso = systemTime.toISOString();
    const fullName = studentMiddleName.trim() 
      ? `${studentLastName.trim()}, ${studentFirstName.trim()} ${studentMiddleName.trim()}`
      : `${studentLastName.trim()}, ${studentFirstName.trim()}`;

    const newSubmission: PUPSubmission = {
      id: trackingId,
      timestamp: nowIso,
      dateString: nowIso.substring(0, 10),
      purpose: selectedPurpose,
      studentFirstName: studentFirstName.trim(),
      studentMiddleName: studentMiddleName.trim() || undefined,
      studentLastName: studentLastName.trim(),
      studentName: fullName,
      studentEmail: studentEmail.trim().toLowerCase(),
      contactNumber: contactNumber.trim(),
      deliveryMethod: deliveryMethod,
     courierTrackingNumber: ['Walk-in'].includes(deliveryMethod) || !courierTracking.trim()
  ? undefined
  : courierTracking.trim(),
      documents: checklist,
      remarks: remarks.trim() || undefined,
      notified: true,
      notificationTimestamp: nowIso
    };

    const checkedDocs = checklist.filter(d => d.checked);
    const missingDocs = checklist.filter(d => !d.checked && d.required);

    const formattedDate = systemTime.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const compiled = compileEmailTemplate(newSubmission, checkedDocs, missingDocs, formattedDate, 'cid:pupLogo');
    const emailSubject = compiled.subject;
    const emailBody = compiled.body;

    const emailLogId = `EML-${getSchoolYearStartYear(systemTime)}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const newEmail: SimulatedEmail = {
      id: emailLogId,
      submissionId: trackingId,
      recipientEmail: studentEmail.trim().toLowerCase(),
      recipientName: fullName,
      subject: emailSubject,
      bodyHtml: emailBody,
      timestamp: nowIso
    };

    setDbLoading(true);

    const readApiError = async (res: Response, fallbackMessage: string) => {
      try {
        const data = await res.json();
        return data?.error || data?.message || fallbackMessage;
      } catch {
        return fallbackMessage;
      }
    };

    apiFetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSubmission)
    })
    .then(async res => {
      if (!res.ok) {
        const message = await readApiError(res, 'Failed to save submission.');
        throw new Error(message);
      }
      return res.json();
    })
    .then(async () => {
      setSubmissions(prev => [newSubmission, ...prev]);
      logAuditAction('CREATE', `Added new submission ${trackingId} for ${fullName}`, trackingId);

      const emailRes = await apiFetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmail)
      });

      if (!emailRes.ok) {
        const message = await readApiError(emailRes, 'The record was saved, but the acknowledgement email was not sent.');
        throw new Error(`Record saved, but email failed: ${message}`);
      }

      await emailRes.json();
      setSimulatedEmails(prev => [newEmail, ...prev]);
      setNewSubmissionSuccess(newSubmission);
      handleResetForm();
    })
    .catch(err => {
      console.error('Error saving submission or sending email:', err);
      alert(err.message || 'There was a problem saving the record. Please check the server terminal for details.');
    })
    .finally(() => {
      setDbLoading(false);
    });
  };

  // Delete / Undo log entry
  const handleDeleteSubmission = (id: string) => {
    if (currentUser?.role !== 'Head Admin') {
      alert('Access Denied: Administrative privileges are required to delete ledger entries.');
      return;
    }
    if (confirm(`Are you sure you want to delete this entry (${id})? This will also remove the simulated email.`)) {
      setDbLoading(true);
      apiFetch(`/api/submissions/${id}`, {
        method: 'DELETE'
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to delete submission');
        return res.json();
      })
      .then(() => {
        setSubmissions(prev => prev.filter(s => s.id !== id));
        setSimulatedEmails(prev => prev.filter(e => e.submissionId !== id));
        logAuditAction('DELETE', `Deleted submission ${id}`, id);
      })
      .catch(err => {
        console.error('Error deleting entry from database:', err);
        alert('Could not remove the entry from the database server: ' + err.message);
      })
      .finally(() => {
        setDbLoading(false);
      });
    }
  };

  // --- CSV Export Functions ---
  const handleExportCSV = () => {
    // Generate simple structured comma-separated values
    const headers = [
      'Tracking ID',
      'Date & Time',
      'Student First Name',
      'Student Middle Name',
      'Student Last Name',
      'Student Email',
      'Contact',
      'Purpose',
      'Delivery Method',
      'Courier Pouch #',
      'Total Documents',
      'Received Count',
      'Received List',
      'Pending List',
      'Remarks'
    ];

    const rows = submissions.map(s => {
      const receivedList = s.documents.filter(d => d.checked).map(d => d.name).join(' | ');
      const pendingList = s.documents.filter(d => !d.checked && d.required).map(d => d.name).join(' | ');
      const formattedTimestamp = new Date(s.timestamp).toLocaleString();
      
      return [
        `"${s.id}"`,
        `"${formattedTimestamp}"`,
        `"${(s.studentFirstName || '').replace(/"/g, '""')}"`,
        `"${(s.studentMiddleName || '').replace(/"/g, '""')}"`,
        `"${(s.studentLastName || '').replace(/"/g, '""')}"`,
        `"${s.studentEmail}"`,
        `"${s.contactNumber || ''}"`,
        `"${s.purpose}"`,
        `"${s.deliveryMethod}"`,
        `"${s.courierTrackingNumber || ''}"`,
        s.documents.length,
        s.documents.filter(d => d.checked).length,
        `"${receivedList.replace(/"/g, '""')}"`,
        `"${pendingList.replace(/"/g, '""')}"`,
        `"${(s.remarks || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PUP-OUS-Admission-Monitoring_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };





  // --- Filtering Logic ---
  const isWithinDateRange = (timestampStr: string) => {
    if (dateFilterType === 'all') return true;
    const date = new Date(timestampStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    if (dateFilterType === 'today') {
      return date >= today;
    }
    if (dateFilterType === 'this_week') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return date >= startOfWeek;
    }
    if (dateFilterType === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= startOfMonth;
    }
    if (dateFilterType === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      let valid = true;
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        valid = valid && date >= start;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23,59,59,999);
        valid = valid && date <= end;
      }
      return valid;
    }
    return true;
  };

  const dateFilteredSubmissions = submissions.filter(s => isWithinDateRange(s.timestamp));

  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.user.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
      (log.targetId || '').toLowerCase().includes(auditSearchTerm.toLowerCase());
    const matchesAction = auditActionFilter === 'ALL' || log.action === auditActionFilter;
    return matchesSearch && matchesAction;
  });

  const filteredSubmissions = dateFilteredSubmissions.filter(s => {
    const matchesSearch = 
      (s.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentFirstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentMiddleName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.studentLastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.courierTrackingNumber && s.courierTrackingNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPurpose = filterPurpose === 'All' || s.purpose === filterPurpose;
    const matchesDelivery = filterDelivery === 'All' || s.deliveryMethod === filterDelivery;

    // Status is determined by completeness of documents checklist
    const checkedCount = s.documents.filter(d => d.checked).length;
    const totalCount = s.documents.length;
    const isComplete = checkedCount === totalCount;
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Complete' && isComplete) || 
      (filterStatus === 'Pending' && !isComplete);

    return matchesSearch && matchesPurpose && matchesDelivery && matchesStatus;
  });

  if (!currentUser) {
    return (
      <main
        id="login-page"
        className={`min-h-screen selection:pup-maroon selection:text-white relative overflow-hidden font-sans bg-cover bg-center bg-no-repeat login-bg-${loginBackgroundIndex}`}
      >
        {/* Dynamic PUP landing background overlay */}
<div className="absolute inset-0 bg-linear-to-r from-[#8B0000]/45 via-[#610000]/30 to-[#1A0A0A]/40 z-0" />
<div className="absolute inset-0 bg-black/10 z-0" />
   

        <section className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Left Column: PUP identity */}
          <div className="flex flex-col items-center justify-center px-6 sm:px-10 lg:px-12 py-8 lg:py-12 text-center text-white min-h-[40vh] lg:min-h-screen">
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="flex flex-col items-center justify-center"
            >
              <PUPLogo
                size={88}
                className="bg-white border-0 shadow-[0_10px_30px_rgba(0,0,0,0.26)] hover:scale-105 transition-transform duration-500"
              />

              <h1 className="mt-5 text-white font-serif font-semibold text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.15] tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] max-w-2xl">
  Polytechnic University<br className="hidden sm:block" /> of the Philippines
</h1>

<p className="mt-4 text-white/95 font-semibold text-[17px] sm:text-[19px] tracking-wide drop-shadow-[0_2px_7px_rgba(0,0,0,0.28)]">
  &quot;Mula sa&apos;yo, para sa bayan&quot;
</p>

              <div className="mt-8 w-full max-w-400px rounded-2xl bg-[#2f272c]/75 border border-white/20 px-6 py-4 backdrop-blur-md text-center shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                <span className="text-[#FCD34D] font-extrabold text-xs tracking-[0.16em] uppercase block mb-1.5">
                  PDTS
                </span>
                <span className="text-white text-sm sm:text-[15.5px] font-semibold block leading-relaxed">
                  PUPOUS Document Tracking System
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Login card based on the requested reference */}
          <div className="flex items-center justify-center px-5 sm:px-8 lg:pl-6 lg:pr-16 py-7 lg:py-9 lg:min-h-screen lg:overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 }}
             className="relative bg-white rounded-[28px] w-full max-w-[420px] px-6 py-7 sm:px-8 sm:py-8 lg:px-9 lg:py-9 shadow-[0_18px_55px_rgba(0,0,0,0.24)] border border-white/80 flex flex-col"
            >
              {!isForgotPassword ? (
                <>
                  <h2 className="text-[#970000] font-serif font-bold text-[34px] sm:text-[40px] lg:text-[44px] leading-none tracking-[-0.04em] text-left">
                    Welcome Back
                  </h2>
                  <p className="text-[#6B7280] text-[16px] sm:text-[18px] font-bold mt-4 text-left leading-tight">
                    Sign in to your Registrar account
                  </p>

                  <form onSubmit={handleLoginSubmit} className="mt-10 space-y-6 text-left">
                    {loginError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-sm leading-tight font-semibold"
                      >
                        {loginError}
                      </motion.div>
                    )}

                 <div>
  <label className="block text-[13px] sm:text-sm font-extrabold text-[#374151] uppercase tracking-[0.02em] mb-3">
    Username
  </label>
  <div className="relative">
    <input
      type="text"
      required
      autoComplete="username"
      value={usernameInput}
      onChange={(e) => setUsernameInput(e.target.value)}
      placeholder="Enter Username"
      className="w-full h-[58px] bg-[#EEF4FF] border border-[#DDE8FA] rounded-[16px] px-6 pr-6 text-[18px] font-bold focus:outline-none focus:ring-4 focus:ring-[#970000]/10 focus:border-[#970000]/30 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
    />
  </div>
</div>

<div>
  <label className="block text-[13px] sm:text-sm font-extrabold text-[#374151] uppercase tracking-[0.02em] mb-3">
    Password
  </label>
  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      required
      autoComplete="current-password"
      value={passwordInput}
      onChange={(e) => setPasswordInput(e.target.value)}
      placeholder="Enter Password"
      className="w-full h-[58px] bg-[#EEF4FF] border border-[#DDE8FA] rounded-[16px] px-6 pr-[54px] text-[18px] font-bold focus:outline-none focus:ring-4 focus:ring-[#970000]/10 focus:border-[#970000]/30 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute inset-y-0 right-4 flex items-center justify-center text-[#9CA3AF] hover:text-[#6B7280] cursor-pointer transition-colors"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
    </button>
  </div>
</div>

                    <button
                      type="submit"
                      disabled={isLoginLoading}
                      className="w-full h-[60px] mt-6 bg-[#970000] hover:bg-[#A4161A] active:bg-[#6F0000] text-white font-extrabold text-[19px] rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait shadow-[0_8px_16px_rgba(151,0,0,0.20)]"
                    >
                      <span>{isLoginLoading ? 'Signing In...' : 'Sign In'}</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setLoginError('');
                        }}
                        className="text-[#970000] hover:text-[#A4161A] hover:underline text-[15px] font-extrabold transition-all cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-[#970000] font-serif font-bold text-[32px] sm:text-[38px] lg:text-[42px] leading-none tracking-[-0.04em] text-left">
                    Recover Account
                  </h2>
                  <p className="text-[#6B7280] text-[16px] sm:text-[18px] font-bold mt-4 text-left leading-tight">
                    Request a temporary password using your registered email
                  </p>

                  <form onSubmit={handleForgotPasswordSubmit} className="mt-10 space-y-6 text-left">
                    {recoverySuccess && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold"
                      >
                        {recoverySuccess}
                      </motion.div>
                    )}

                    {recoveryError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl px-4 py-3 text-sm leading-relaxed font-semibold"
                      >
                        {recoveryError}
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-[13px] sm:text-sm font-extrabold text-[#374151] uppercase tracking-[0.02em] mb-3">
                        Registered Email Address
                      </label>
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="e.g. registrar@pup.edu.ph"
                        className="w-full h-[58px] bg-[#EEF4FF] border border-[#DDE8FA] rounded-[16px] px-6 text-[17px] font-bold focus:outline-none focus:ring-4 focus:ring-[#970000]/10 focus:border-[#970000]/30 transition-all text-[#1F2937] placeholder:text-[#9CA3AF]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRecoveryLoading}
                      className="w-full h-[60px] mt-6 bg-[#970000] hover:bg-[#A4161A] active:bg-[#6F0000] text-white font-extrabold text-[18px] rounded-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-wait shadow-[0_8px_16px_rgba(151,0,0,0.20)]"
                    >
                      <span>{isRecoveryLoading ? 'Verifying Account...' : 'Send Temporary Password'}</span>
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setRecoveryError('');
                          setRecoverySuccess('');
                        }}
                        className="text-[#970000] hover:text-[#A4161A] hover:underline text-[15px] font-extrabold transition-all cursor-pointer"
                      >
                        Back to Login
                      </button>
                    </div>
                  </form>
                </>
              )}

              <p className="text-center mt-8 text-[#9CA3AF] text-[15px] font-extrabold">
                PUP Registrar&apos;s Office
              </p>
            </motion.div>
          </div>
        </section>

        <footer className="relative lg:absolute left-0 right-0 bottom-0 z-20 px-5 pb-2 text-center text-white/90 text-xs leading-relaxed pointer-events-none bg-[#1A0A0A]/70 lg:bg-transparent">
          <span className="inline-block max-w-[920px] rounded-full lg:bg-[#1A0A0A]/70 lg:border lg:border-white/20 px-3.5 py-2 backdrop-blur-sm">
            © 2026 PUPOUS Document Tracking System. All Rights Reserved. Developed for PUP Open University System.
          </span>
        </footer>
       </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-[#800000] selection:text-white">
      
      {/* 1. Header Banner (PUP Official branding theme) - High Density Styled */}
      <header className="bg-[#800000] text-white border-b-2 border-[#FCD34D] shadow-xs shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3 text-center sm:text-left">
            <PUPLogo size={40} />
            <div>
              <h1 className="font-display font-extrabold text-base tracking-tight text-white leading-none mt-1">
                PUPOUS Document Tracking System
              </h1>
            </div>
          </div>

          {/* Clock & Session Details */}
          <div className="flex items-center gap-3 bg-[#600000]/60 px-3 py-1 rounded-lg border border-white/10 text-[11px] self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="space-y-0.5">
              <p className="text-rose-100/80 text-[10px] font-mono leading-none flex items-center gap-1 flex-wrap">
                Desk: <span className="text-[#FCD34D] font-bold">{currentUser?.fullName}</span>
                <span className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded shrink-0 ${
                  currentUser?.role === 'Head Admin' ? 'bg-rose-600 text-white border border-rose-500' :
                  currentUser?.role === 'Registrar Officer' ? 'bg-amber-400 text-slate-900 border border-amber-300' :
                  'bg-indigo-600 text-white border border-indigo-500'
                }`}>
                  {currentUser?.role}
                </span>
              </p>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <div className="text-right font-mono space-y-0.5">
              <div className="text-slate-100 font-bold flex items-center gap-1 leading-none">
                <Clock className="w-3 h-3 text-[#FCD34D]" />
                <span>{systemTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
              <p className="text-rose-100/70 text-[9px] leading-none">{systemTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
            </div>
            <div className="h-6 w-px bg-white/20"></div>
            <button
              onClick={handleSignOut}
              className="bg-white/10 hover:bg-white/25 text-white hover:text-[#FCD34D] border border-white/10 rounded px-2 py-1 flex items-center gap-1 text-[10px] font-black tracking-wide transition-all cursor-pointer hover:border-[#FCD34D]/40 shrink-0"
              title="Sign Out / Switch Operator"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Primary Navigation / Mode Switcher */}
      <nav className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-10 shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-10">

            {/* Nav Tabs */}
            <div className="flex space-x-1 h-full overflow-x-auto">
              <button
                id="tab-log-btn"
                onClick={() => setActiveTab('log')}
                className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-display text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'log'
                    ? 'border-pup-maroon text-pup-maroon bg-rose-50/10'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Document</span>
              </button>

              <button
                id="tab-ledger-btn"
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-display text-xs font-bold transition-all shrink-0 whitespace-nowrap relative ${
                  activeTab === 'ledger'
                    ? 'border-pup-maroon text-pup-maroon bg-rose-50/10'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span>Logs Ledger</span>
                {submissions.length > 0 && (
                  <span className="bg-pup-maroon text-white text-[9px] px-1 py-0.2 rounded-full font-bold ml-1 font-mono">
                    {submissions.length}
                  </span>
                )}
              </button>

              {currentUser?.role === 'Head Admin' && (
                <>
                  <button
                    id="tab-audit-btn"
                    onClick={() => setActiveTab('audit')}
                    className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-display text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'audit'
                        ? 'border-pup-maroon text-pup-maroon bg-rose-50/10'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit Logs</span>
                  </button>

                  <button
                    id="tab-admin-settings-btn"
                    onClick={() => setActiveTab('admin-settings')}
                    className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-display text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                      activeTab === 'admin-settings'
                        ? 'border-pup-maroon text-pup-maroon bg-rose-50/10'
                        : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Admin Settings</span>
                  </button>
                </>
              )}

              <button
                id="tab-account-btn"
                onClick={() => setActiveTab('account')}
                className={`flex items-center gap-1.5 px-3 h-full border-b-2 font-display text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                  activeTab === 'account'
                    ? 'border-pup-maroon text-pup-maroon bg-rose-50/10'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </button>
            </div>

            {/* Quick Helper Text */}
            <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-gray-500 shrink-0 pl-3">
              <span className="text-gray-400">PUP Open University System Portal</span>
            </div>

          </div>
        </div>
      </nav>

      {/* 3. Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: QUICK-LOG DATA ENTRY FORM */}
          {activeTab === 'log' && (
            <motion.div
              key="log-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-3.5"
            >
              
              {/* Form Side - Left 7 columns */}
              <div className="lg:col-span-7 space-y-3.5">
                
                <form onSubmit={handleFormSubmit} className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                  
                  {/* Form Header */}
                  <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light text-white p-3">
                    <h2 className="font-display font-extrabold text-sm flex items-center gap-1.5">
                      <FileCheck className="w-5 h-5 text-pup-gold" />
                      Quick Admission Document Entry
                    </h2>
                    <p className="text-[10px] text-rose-100/90 mt-0.5 leading-tight">
                      Please select a purpose first to load the default checklist, check off the received requirements, and save to notify the student.
                    </p>
                  </div>

                  {/* Form Body */}
                  <div className="p-3.5 space-y-3.5">
                    
                    {/* SECTION 1: PURPOSE (Critical manager requirement - MUST BE FIRST) */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">
                        1. Select Purpose (First Step)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5" id="purpose-grid">
                        {(['Admission - Graduation', 'Admission - Bachelor', 'Masteral', 'Comprehensive Exam', 'Deficiency'] as PurposeType[]).map((purpose) => {
                          const isActive = selectedPurpose === purpose;
                          return (
                            <button
                              key={purpose}
                              type="button"
                              onClick={() => setSelectedPurpose(purpose)}
                              className={`p-1.5 rounded-lg border flex flex-col items-center justify-center text-center gap-1 transition-all focus:outline-none min-h-[40px] ${
                                isActive 
                                  ? 'bg-pup-maroon text-white border-pup-maroon shadow-xs ring-1 ring-pup-gold ring-offset-1' 
                                  : 'bg-slate-50 border-gray-200 text-gray-700 hover:bg-slate-100 hover:border-gray-300'
                              }`}
                            >
                              {purpose === 'Admission - Graduation' && <GraduationCap className={`w-4 h-4 ${isActive ? 'text-pup-gold' : 'text-pup-maroon'}`} />}
                              {purpose === 'Admission - Bachelor' && <BookOpen className={`w-4 h-4 ${isActive ? 'text-pup-gold' : 'text-pup-maroon'}`} />}
                              {purpose === 'Masteral' && <FileText className={`w-4 h-4 ${isActive ? 'text-pup-gold' : 'text-pup-maroon'}`} />}
                              {purpose === 'Comprehensive Exam' && <CheckCircle className={`w-4 h-4 ${isActive ? 'text-pup-gold' : 'text-pup-maroon'}`} />}
                              {purpose === 'Deficiency' && <AlertTriangle className={`w-4 h-4 ${isActive ? 'text-pup-gold' : 'text-pup-maroon'}`} />}
                              
                              <span className="text-[9px] font-extrabold tracking-tight leading-none">
                                {purpose}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2: STUDENT DETAILS */}
                    <div className="space-y-2.5">
                      <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-400 border-b border-gray-100 pb-1">
                        2. Student Information
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Student First Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Maria Leonora"
                            value={studentFirstName}
                            onChange={(e) => setStudentFirstName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all capitalize"
                          />
                        </div>

                        {/* Student Middle Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            Middle Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Santos (Optional)"
                            value={studentMiddleName}
                            onChange={(e) => setStudentMiddleName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all capitalize"
                          />
                        </div>

                        {/* Student Last Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Santos"
                            value={studentLastName}
                            onChange={(e) => setStudentLastName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all capitalize"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Student Email */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="student@gmail.com"
                            value={studentEmail}
                            onChange={(e) => setStudentEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all lowercase"
                          />
                        </div>

                        {/* Contact Number */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            Contact Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="e.g. 0917XXXXXXX"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Delivery Method */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-0.5 flex items-center gap-1">
                            <Truck className="w-3 h-3 text-gray-400" />
                            Delivery Method
                          </label>
                          <select
                            aria-label="Select delivery method"
                            value={deliveryMethod}
                            onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethodType)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-1.5 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold"
                          >
                            <option value="Walk-in">🚶‍♂️ Walk-in (Counter Submission)</option>
                            <option value="Courier">📦 via Courier</option>
                          </select>
                        </div>

                        {/* Optional Courier Reference Number */}
                        {deliveryMethod !== 'Walk-in' && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-rose-50/40 p-2 rounded-md border border-rose-100 flex flex-col justify-center"
                          >
                            <label className="block text-[9px] font-extrabold text-pup-maroon-light mb-0.5">
                             COURIER TRACKING NUMBER / AIR WAYBILL (AWB) <span className="text-gray-400">(Optional)</span>
                            </label>
                            <input
                              type="text"
                            
                              placeholder="Pouch receipt tracking number..."
                              value={courierTracking}
                              onChange={(e) => setCourierTracking(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-md py-1 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon font-mono uppercase"
                            />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 3: Remarks */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        Additional Remarks / Office Instructions (Optional)
                      </label>
                      <textarea
                        rows={1.5}
                        placeholder="e.g. 'To follow original TOR', 'Lacks good moral character certificate'"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all resize-none font-medium"
                      />
                    </div>

                  </div>

                  {/* Form Footer Action */}
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetForm}
                      className="text-[11px] text-gray-500 hover:text-gray-900 font-bold px-3 py-1.5 hover:bg-gray-100 rounded transition-all"
                    >
                      Clear Form
                    </button>
                    <button
                      type="submit"
                      id="save-submit-btn"
                      disabled={dbLoading}
                      className="bg-pup-maroon hover:bg-pup-maroon-dark disabled:bg-slate-400 disabled:cursor-wait text-white font-display font-black text-xs py-2 px-5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>{dbLoading ? 'Saving...' : 'Save and Email Student'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </form>

              </div>

              {/* Requirements Checklist Side - Right 5 columns */}
              <div className="lg:col-span-5 space-y-3.5">
                
                {/* Requirements Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col h-full min-h-[440px]">
                  
                  {/* Card Header */}
                  <div className="bg-pup-maroon text-white p-3 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] uppercase font-extrabold tracking-wider text-pup-gold">Requirements Checklist</span>
                      <h3 className="font-display font-bold text-xs tracking-tight text-slate-100">
                        {selectedPurpose} Checklist
                      </h3>
                    </div>
                    {/* Progress Badge */}
                    <div className="bg-pup-maroon text-pup-gold font-mono font-bold text-xs px-2 py-0.5 rounded-full border border-pup-maroon-light">
                      {checklist.filter(d => d.checked).length}/{checklist.length}
                    </div>
                  </div>

                  {/* Quick Toggles */}
                  <div className="bg-slate-100 px-3 py-1.5 border-b border-gray-200 flex justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleAll(true)}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[10px] font-extrabold py-1 rounded text-slate-700 transition-all text-center"
                    >
                      ☑ Check All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAll(false)}
                      className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-[10px] font-extrabold py-1 rounded text-slate-700 transition-all text-center"
                    >
                      ☐ Uncheck All
                    </button>
                  </div>

                  {/* Checklist Items */}
                  <div className="p-2.5 flex-1 overflow-y-auto max-h-[300px] space-y-1.5">
                    {checklist.map((item, index) => {
                      const isEditing = editingActiveChecklistIndex === index;

                      return (
                        <div
                          key={index}
                          className={`group w-full p-2 rounded-lg border transition-all min-h-[36px] ${
                            isEditing 
                              ? 'bg-amber-50/30 border-amber-300 ring-1 ring-amber-300 shadow-sm'
                              : item.checked 
                                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 shadow-xs hover:bg-emerald-50/70' 
                                : 'bg-white border-gray-200 hover:bg-slate-50 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              {/* Inline Editing Form */}
                              <input
                                type="text"
                                value={editingActiveChecklistName}
                                onChange={(e) => setEditingActiveChecklistName(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded px-2 py-1 text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-pup-maroon focus:outline-none"
                                placeholder="Requirement Name"
                                autoFocus
                              />
                              <div className="flex items-center justify-between">
                                <label className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editingActiveChecklistRequired}
                                    onChange={(e) => setEditingActiveChecklistRequired(e.target.checked)}
                                    className="rounded border-gray-300 text-pup-maroon focus:ring-pup-maroon"
                                  />
                                  <span>Strictly Required</span>
                                </label>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveActiveChecklistItem(index)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded font-bold transition-all flex items-center justify-center cursor-pointer"
                                    title="Save Changes"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelEditActiveChecklistItem}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-1 rounded font-bold transition-all flex items-center justify-center cursor-pointer"
                                    title="Cancel"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              {/* Clickable Area to Toggle */}
                              <div
                                onClick={() => handleToggleCheck(index)}
                                className="flex-1 flex items-start gap-2.5 cursor-pointer select-none"
                              >
                                {/* Checkbox Icon */}
                                <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                                  item.checked 
                                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                                    : 'border-gray-300 bg-white'
                                }`}>
                                  {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                <div className="text-[11px] leading-tight">
                                  <span className={`font-semibold ${item.checked ? 'text-emerald-900 font-bold' : 'text-gray-800'}`}>
                                    {item.name}
                                  </span>
                                  {item.required && (
                                    <span className="ml-1 text-red-500 font-extrabold text-[10px]" title="Required to submit">* Required</span>
                                  )}
                                </div>
                              </div>

                              {/* Action Controls */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditActiveChecklistItem(index)}
                                  className="text-gray-400 hover:text-blue-600 hover:bg-slate-100 p-1 rounded transition-colors cursor-pointer"
                                  title="Edit requirement details inline"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteActiveChecklistItem(index)}
                                  className="text-gray-400 hover:text-red-600 hover:bg-slate-100 p-1 rounded transition-colors cursor-pointer"
                                  title="Delete requirement from this check"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {checklist.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-xs">
                        Loading documents...
                      </div>
                    )}
                  </div>

                  {/* Custom Document Entry */}
                  <form onSubmit={handleAddCustomDoc} className="p-2.5 bg-slate-50 border-t border-gray-100 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add a custom document..."
                      value={customDocName}
                      onChange={(e) => setCustomDocName(e.target.value)}
                      className="flex-1 bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon font-medium"
                    />
                    <button
                      type="submit"
                       className="bg-pup-maroon hover:bg-pup-maroon-dark text-white text-[11px] px-3 py-1 rounded-md font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </form>

                </div>

              </div>

            </motion.div>
          )}

          {/* TAB 2: DAILY MONITORING LOGBOOK / LEDGER */}
          {activeTab === 'ledger' && (
            <motion.div
              key="ledger-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-3"
            >
              
              {/* Filter controls and Search Bar */}
              <div className="bg-white p-2.5 rounded-lg border border-gray-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
                
                {/* Search input */}
                <div className="relative w-full md:max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <Search className="w-3.5 h-3.5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name, email, or tracking number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-medium"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 text-[10px] font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold">
                    <Filter className="w-3 h-3" />
                    <span>FILTER:</span>
                  </div>

                  {/* Purpose Filter */}
                  <select
                  aria-label="Filter by purpose"
                    value={filterPurpose}
                    onChange={(e) => setFilterPurpose(e.target.value)}
                    className="bg-slate-50 border border-gray-300 text-[10px] rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-pup-maroon font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="All">All Purposes</option>
                    <option value="Admission - Graduation">Admission - Graduation</option>
                    <option value="Admission - Bachelor">Admission - Bachelor</option>
                    <option value="Masteral">Masteral</option>
                    <option value="Comprehensive Exam">Comprehensive Exam</option>
                    <option value="Deficiency">Deficiency</option>
                  </select>

                  {/* Delivery Filter */}
                  <select
                    aria-label="Filter by delivery method"
                    value={filterDelivery}
                    onChange={(e) => setFilterDelivery(e.target.value)}
                    className="bg-slate-50 border border-gray-300 text-[10px] rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-pup-maroon font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="All">All Deliveries</option>
                    <option value="Walk-in">Walk-in Only</option>
                    <option value="Courier">Courier Only</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    aria-label="Filter by status"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-50 border border-gray-300 text-[10px] rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-pup-maroon font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Complete">Complete Only</option>
                    <option value="Pending">Pending Only</option>
                  </select>

                  {/* Date Filter */}
                  <select
                    aria-label="Filter by date range"
                    value={dateFilterType}
                    onChange={(e) => setDateFilterType(e.target.value as any)}
                    className="bg-slate-50 border border-gray-300 text-[10px] rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-pup-maroon font-bold text-gray-700 cursor-pointer"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="this_week">This Week</option>
                    <option value="this_month">This Month</option>
                    <option value="custom">Custom Date</option>
                  </select>

                  {dateFilterType === 'custom' && (
                    <div className="flex items-center gap-1">
                      <PUPDatePicker
                        value={customStartDate}
                        onChange={(val) => setCustomStartDate(val)}
                        placeholder="Start Date"
                      />
                      <span className="text-gray-400 text-[10px]">-</span>
                      <PUPDatePicker
                        value={customEndDate}
                        onChange={(val) => setCustomEndDate(val)}
                        placeholder="End Date"
                      />
                    </div>
                  )}

                  {/* Export Trigger */}
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold py-1 px-2.5 rounded-md flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Excel Export</span>
                  </button>
                </div>

              </div>

              {/* Table ledger logbook */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-gray-500">
                    <thead className="bg-pup-maroon text-[10px] text-white font-extrabold uppercase tracking-wider border-b border-pup-maroon-dark">
                      <tr>
                        <th scope="col" className="px-3 py-2">Tracking Code</th>
                        <th scope="col" className="px-3 py-2">Student</th>
                        <th scope="col" className="px-3 py-2">Purpose</th>
                        <th scope="col" className="px-3 py-2">Delivery Details</th>
                        <th scope="col" className="px-3 py-2">Requirements Progress</th>
                        <th scope="col" className="px-3 py-2">E-mail Sent</th>
                        <th scope="col" className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      
                      {filteredSubmissions.map((sub) => {
                        const checkedCount = sub.documents.filter(d => d.checked).length;
                        const totalCount = sub.documents.length;
                        const isComplete = checkedCount === totalCount;

                        return (
                          <tr key={sub.id} className="hover:bg-slate-50/60 transition-all odd:bg-white even:bg-slate-50/20">
                            
                            {/* Tracking ID */}
                            <td className="px-3 py-1.5 font-mono font-bold text-pup-maroon text-[11px] whitespace-nowrap">
                              {sub.id}
                            </td>

                            {/* Student Details */}
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="font-display font-extrabold text-gray-900 uppercase tracking-tight text-[11px]">
                                {sub.studentLastName 
                                  ? (sub.studentMiddleName 
                                      ? `${sub.studentLastName}, ${sub.studentFirstName} ${sub.studentMiddleName}`
                                      : `${sub.studentLastName}, ${sub.studentFirstName}`)
                                  : (sub.studentName || '')}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono flex flex-col leading-tight mt-0.5">
                                <span>{sub.studentEmail}</span>
                                {sub.contactNumber && <span>Tel: {sub.contactNumber}</span>}
                              </div>
                            </td>

                            {/* Purpose Badge */}
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-0.5 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded font-mono ${
                                sub.purpose === 'Admission - Graduation' ? 'bg-purple-50 text-purple-800 border border-purple-100' :
                                sub.purpose === 'Admission - Bachelor' ? 'bg-blue-50 text-blue-800 border border-blue-100' :
                                sub.purpose === 'Masteral' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                                sub.purpose === 'Comprehensive Exam' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                                'bg-amber-50 text-amber-800 border border-amber-100'
                              }`}>
                                {sub.purpose}
                              </span>
                            </td>

                            {/* Delivery details & courier reference */}
                            <td className="px-3 py-1.5 whitespace-nowrap text-[11px]">
                              <span className="font-bold text-gray-700 block">
                                {sub.deliveryMethod}
                              </span>
                              {sub.courierTrackingNumber ? (
                                <span className="font-mono text-[9px] text-gray-500 bg-slate-100 px-1 py-0.2 rounded border border-gray-200 mt-0.5 block w-fit">
                                  Ref: {sub.courierTrackingNumber}
                                </span>
                              ) : (
                                <span className="text-[9px] text-gray-400 block italic">Personal Walk-in</span>
                              )}
                            </td>

                            {/* Requirements checklist count */}
                            <td className="px-3 py-1.5 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[11px] font-mono font-bold ${isComplete ? 'text-green-700' : 'text-gray-700'}`}>
                                  {checkedCount}/{totalCount} received
                                </span>
                                <span className={`w-2 h-2 rounded-full ${isComplete ? 'bg-green-500' : 'bg-amber-500'}`} title={isComplete ? 'Complete' : 'Pending Requirements'}></span>
                              </div>
                              <div className="text-[9px] text-gray-400 mt-0.2">
                                {isComplete ? 'Fully Complete' : `${totalCount - checkedCount} missing`}
                              </div>
                            </td>

                            {/* Simulated notification status */}
                            <td className="px-3 py-1.5 whitespace-nowrap text-[11px]">
                              {sub.notified ? (
                                <div className="space-y-0.2">
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded border border-emerald-100">
                                    ✓ Sent OK
                                  </span>
                                  <span className="block text-[9px] text-slate-400 font-mono">
                                    {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-[10px]">Not Sent</span>
                              )}
                            </td>

                            {/* Row Action buttons */}
                            <td className="px-3 py-1.5 whitespace-nowrap text-[11px] font-bold">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedSubmissionForSlip(sub)}
                                  className="inline-flex items-center gap-0.5 text-pup-maroon hover:bg-rose-50 px-1.5 py-0.5 rounded border border-transparent hover:border-rose-100 transition-all cursor-pointer text-[10px]"
                                  title="View Reference Slip"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Slip</span>
                                </button>

                                <button
                                  onClick={() => setSelectedSubmissionForEmail(sub)}
                                  className="inline-flex items-center gap-0.5 text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-transparent hover:border-blue-100 transition-all cursor-pointer text-[10px]"
                                  title="View Email Notification Log"
                                >
                                  <Mail className="w-3 h-3" />
                                  <span>Email</span>
                                </button>

                                {currentUser?.role === 'Head Admin' ? (
                                  <button
                                    onClick={() => handleDeleteSubmission(sub.id)}
                                    className="inline-flex items-center gap-0.5 text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded border border-transparent hover:border-rose-100 transition-all cursor-pointer text-[10px]"
                                    title="Delete Record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                ) : (
                                  <button
                                    disabled
                                    className="inline-flex items-center gap-0.5 text-slate-300 px-1.5 py-0.5 rounded text-[10px] cursor-not-allowed"
                                    title="Requires Head Admin privileges to delete records"
                                  >
                                    <Lock className="w-3 h-3 text-slate-350" />
                                    <span>Delete</span>
                                  </button>
                                )}
                              </div>
                            </td>

                          </tr>
                        );
                      })}

                      {filteredSubmissions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400 font-bold text-xs">
                            No records found based on your search or filter criteria.
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>
              </div>

            </motion.div>
          )}

          {/* TAB 4: AUDIT LOGS (HEAD ADMIN ONLY) */}
          {activeTab === 'audit' && currentUser?.role === 'Head Admin' && (
            <motion.div
              key="audit-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden flex flex-col min-h-[500px]"
            >
              <div className="bg-pup-maroon text-white p-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-pup-gold" />
                  <h2 className="font-display font-bold text-sm tracking-wide">System Audit Logs</h2>
                </div>
                <div className="text-[10px] bg-pup-maroon-dark text-pup-gold border border-pup-maroon-light/35 px-2 py-0.5 rounded-full font-mono font-medium">
                  {filteredAuditLogs.length} Records
                </div>
              </div>

              <div className="bg-slate-50 border-b border-gray-200 p-3 flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:border-pup-maroon text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Filter by Action:</label>
                  <select
                    aria-label="Filter by action"
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="block w-full md:w-auto pl-2 pr-8 py-1.5 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:border-pup-maroon text-gray-800 font-semibold"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                    <option value="DELETE">Delete</option>
                    <option value="LOGIN">Login</option>
                    <option value="LOGOUT">Logout</option>
                    <option value="RESET">Reset</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Operator</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Target ID</th>
                      <th className="px-4 py-3 w-full">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                    {filteredAuditLogs.length > 0 ? (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-gray-500 text-[10px]">
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider ${
                              log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              log.action === 'DELETE' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              log.action === 'IMPORT' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              log.action === 'RESET' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-gray-100 text-gray-700 border border-gray-300'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-bold text-slate-800">{log.user}</td>
                          <td className="px-4 py-2.5">{log.role}</td>
                          <td className="px-4 py-2.5 font-mono text-[10px] text-gray-500">{log.targetId || '-'}</td>
                          <td className="px-4 py-2.5 text-gray-600 truncate max-w-sm" title={log.details}>{log.details}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 font-medium text-xs">
                          {dbLoading ? 'Loading audit logs...' : 'No audit records found in the database.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ADMIN SETTINGS (HEAD ADMIN ONLY) */}
          {activeTab === 'admin-settings' && currentUser?.role === 'Head Admin' && (
            <motion.div
              key="admin-settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {/* Settings Sub-Navigation Cards */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200/85 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <h2 className="font-serif font-bold text-xl text-pup-maroon">Administrative & Registrar Settings</h2>
                  <p className="text-[11px] text-gray-500 font-medium">Manage OUS Document requirements and system registrar staff credentials securely.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200/50 flex-wrap gap-1 md:flex-nowrap">
                  <button
                    onClick={() => setAdminSettingsSubTab('checklists')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminSettingsSubTab === 'checklists'
                        ? 'bg-white text-pup-maroon shadow-xs border border-gray-150'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <ListChecks className="w-3.5 h-3.5" />
                    <span>Checklist Requirements</span>
                  </button>
                  <button
                    onClick={() => setAdminSettingsSubTab('users')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminSettingsSubTab === 'users'
                        ? 'bg-white text-pup-maroon shadow-xs border border-gray-150'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Staff Accounts</span>
                  </button>
                  <button
                    onClick={() => setAdminSettingsSubTab('email-templates')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      adminSettingsSubTab === 'email-templates'
                        ? 'bg-white text-pup-maroon shadow-xs border border-gray-150'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Templates</span>
                  </button>
                </div>
              </div>

              {adminSettingsSubTab === 'checklists' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Form Side - Add/Edit Requirement */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light text-white p-3.5">
                        <h2 className="font-display font-extrabold text-sm flex items-center gap-1.5">
                          <ListChecks className="w-5 h-5 text-pup-gold" />
                          <span>{editingReqId ? 'Edit Requirement' : 'Add New Requirement'}</span>
                        </h2>
                        <p className="text-[10px] text-rose-100 mt-0.5 font-medium">
                          Configure dynamic requirement checklist templates for active academic purposes.
                        </p>
                      </div>

                      <form onSubmit={handleCreateOrUpdateRequirement} className="p-4 space-y-4">
                        {/* Select Purpose */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Academic Purpose / Process
                          </label>
                          <select
                            aria-label="Select academic purpose"
                            value={managerSelectedPurpose}
                            onChange={(e) => setManagerSelectedPurpose(e.target.value as PurposeType)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold"
                          >
                            <option value="Admission - Graduation">🎓 Admission - Graduation</option>
                            <option value="Admission - Bachelor">🎒 Admission - Bachelor</option>
                            <option value="Masteral">🎓 Masteral</option>
                            <option value="Comprehensive Exam">📝 Comprehensive Exam</option>
                            <option value="Deficiency">⚠️ Deficiency</option>
                          </select>
                        </div>

                        {/* Requirement Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Requirement Document Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Honorable Dismissal / Transfer Credentials"
                            value={newReqName}
                            onChange={(e) => setNewReqName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-medium text-slate-800"
                          />
                        </div>

                        {/* Is Required / Optional Toggle */}
                        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-gray-200">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-gray-700">Strictly Required</span>
                            <span className="text-[9px] text-gray-500">Must be checked off to clear the student submission</span>
                          </div>
                          <input
                            type="checkbox"
                            aria-label="Toggle requirement as strictly required"
                            checked={newReqRequired}
                            onChange={(e) => setNewReqRequired(e.target.checked)}
                            className="w-4.5 h-4.5 text-pup-maroon border-gray-300 rounded focus:ring-pup-maroon cursor-pointer accent-pup-maroon"
                          />
                        </div>

                        {/* Feedback Message */}
                        {reqMessage && (
                          <div className={`p-2.5 rounded-md border text-xs font-medium ${
                            reqMessage.type === 'success' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}>
                            {reqMessage.text}
                          </div>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 bg-pup-maroon hover:bg-pup-maroon-light text-white text-xs font-bold py-2 px-4 rounded-md transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>{editingReqId ? 'Save Changes' : 'Add Requirement'}</span>
                          </button>
                          {editingReqId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-3 rounded-md transition-all border border-gray-300 cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Grid/Table Side - List Requirements */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                      {/* Tab Selector for viewing purposes in checklist table */}
                      <div className="bg-pup-maroon-dark p-2 flex gap-1 overflow-x-auto shrink-0">
                        {(['Admission - Graduation', 'Admission - Bachelor', 'Masteral', 'Comprehensive Exam', 'Deficiency'] as PurposeType[]).map((p) => {
                          const count = checklistTemplates.filter(item => item.purpose === p).length;
                          const active = managerSelectedPurpose === p;
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => {
                                setManagerSelectedPurpose(p);
                                setReqMessage(null);
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                                active
                                  ? 'bg-pup-maroon text-white shadow-xs border border-pup-maroon-light/40'
                                  : 'text-rose-100 hover:text-white hover:bg-pup-maroon-light/30'
                              }`}
                            >
                              <span>{p}</span>
                              <span className={`px-1 rounded-full text-[9px] font-mono ${
                                active ? 'bg-pup-gold text-pup-maroon' : 'bg-pup-maroon-light/50 text-rose-100'
                              }`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Header info */}
                      <div className="border-b border-gray-100 px-4 py-3 bg-slate-50/50 flex justify-between items-center shrink-0">
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                            Checklist Requirements for: <span className="text-pup-maroon">{managerSelectedPurpose}</span>
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            Showing active document checks that are required/optional for this transaction.
                          </p>
                        </div>
                        {checklistTemplates.filter(item => item.purpose === managerSelectedPurpose).length === 0 && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 animate-pulse">
                            Using Default Presets
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-50 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">Document Name</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                            {(() => {
                              const items = checklistTemplates.filter(item => item.purpose === managerSelectedPurpose);
                              if (items.length > 0) {
                                return items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-normal max-w-md">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {item.required ? (
                                        <span className="bg-red-50 text-red-700 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded">
                                          Strictly Required
                                        </span>
                                      ) : (
                                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded">
                                          Optional Check
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          type="button"
                                          onClick={() => handleEditReqClick(item)}
                                          className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-1 rounded transition-colors flex items-center gap-0.5 font-bold cursor-pointer border border-blue-200"
                                          title="Edit Requirement"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                          <span className="text-[10px]">Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteReqClick(item.id, item.name, item.purpose)}
                                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1 rounded transition-colors flex items-center gap-0.5 font-bold cursor-pointer border border-red-200"
                                          title="Delete Requirement"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span className="text-[10px]">Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ));
                              } else {
                                const defaults = DEFAULT_CHECKLISTS[managerSelectedPurpose] || [];
                                return (
                                  <>
                                    <tr className="bg-amber-50/20">
                                      <td colSpan={3} className="px-4 py-2 text-[10px] text-amber-700 font-bold border-b border-amber-100 text-center">
                                        ⚠️ No customized templates found in DB. Showing read-only default preset values:
                                      </td>
                                    </tr>
                                    {defaults.map((item, idx) => (
                                      <tr key={`default-${idx}`} className="opacity-70 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-2.5 text-slate-600 italic whitespace-normal max-w-md">
                                          {item.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                          {item.required ? (
                                            <span className="bg-red-50/70 text-red-600/70 border border-red-100 text-[9px] font-bold px-2 py-0.5 rounded">
                                              Required
                                            </span>
                                          ) : (
                                            <span className="bg-slate-100/70 text-slate-500/70 border border-slate-200 text-[9px] font-bold px-2 py-0.5 rounded">
                                              Optional
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className="text-[9px] text-slate-400 font-mono">Preset Item</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </>
                                );
                              }
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {adminSettingsSubTab === 'users' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Create User Form */}
                  <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light text-white p-3.5">
                        <h2 className="font-display font-extrabold text-sm flex items-center gap-1.5">
                          <UserPlus className="w-5 h-5 text-pup-gold" />
                          <span>Add Registrar Staff</span>
                        </h2>
                        <p className="text-[10px] text-rose-100 mt-0.5 font-medium">
                          Create login credentials for OUS registrars and academic staff.
                        </p>
                      </div>

                      <form onSubmit={handleCreateUserSubmit} className="p-4 space-y-4">
                        {userCreationSuccess && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-lg p-2.5 text-[11px] font-semibold leading-normal">
                            {userCreationSuccess}
                          </div>
                        )}
                        {userCreationError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-850 rounded-lg p-2.5 text-[11px] font-semibold leading-normal">
                            {userCreationError}
                          </div>
                        )}

                        {/* Full Name */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Dr. Juan Dela Cruz"
                            value={newFullName}
                            onChange={(e) => setNewFullName(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold text-slate-800"
                          />
                        </div>

                        {/* Username */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Username
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. jdelacruz"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold text-slate-800"
                          />
                        </div>

                        {/* Registered Email */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Registered Email Address
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. jdelacruz@pup.edu.ph"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold text-slate-800"
                          />
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Initial Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <input
                              type={showNewConfirmPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              value={newConfirmPassword}
                              onChange={(e) => setNewConfirmPassword(e.target.value)}
                              className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 pr-10 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold text-slate-800"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showNewConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Role Select */}
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                            System Role Privilege
                          </label>
                          <select
                            aria-label="Select user role"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value as UserRole)}
                            className="w-full bg-slate-50 border border-gray-300 rounded-md py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all font-semibold"
                          >
                            <option value="Registrar Officer">🔑 Registrar Officer</option>
                            <option value="Head Admin">🛡️ Head Admin</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={isCreatingUser}
                          className="w-full bg-pup-maroon hover:bg-pup-maroon-dark text-white font-bold text-xs py-2 rounded shadow transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isCreatingUser ? 'Creating Account...' : 'Register Account'}</span>
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Registered Users List */}
                  <div className="lg:col-span-8 flex flex-col">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
                      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50">
                        <div>
                          <h3 className="font-serif font-bold text-sm text-slate-800">Registrar Directory</h3>
                          <p className="text-[10px] text-slate-500">
                            Listing of all verified academic registrars and staff accounts in PDTS.
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-pup-maroon bg-rose-50 border border-rose-100 rounded px-2 py-0.5">
                          {dbUsers.length} Active Staff Accounts
                        </span>
                      </div>

                      {/* User Deletion Notifications */}
                      {userDeletionSuccess && (
                        <div className="p-3 mx-4 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold">
                          {userDeletionSuccess}
                        </div>
                      )}
                      {userDeletionError && (
                        <div className="p-3 mx-4 mt-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold">
                          {userDeletionError}
                        </div>
                      )}

                      <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-slate-100 border-b border-gray-200 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
                            <tr>
                              <th className="px-4 py-2.5">Full Name</th>
                              <th className="px-4 py-2.5">Username</th>
                              <th className="px-4 py-2.5">Email Address</th>
                              <th className="px-4 py-2.5 text-center">Privilege Role</th>
                              <th className="px-4 py-2.5 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[11px] text-gray-700">
                            {dbUsers.map((u) => {
                              const isSelf = currentUser?.username === u.username;
                              const isPrimaryAdmin = u.username === 'admin001';
                              const preventDelete = isSelf || isPrimaryAdmin;

                              return (
                                <tr key={u.username} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-slate-800">
                                    {u.fullName}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-600">
                                    {u.username}
                                  </td>
                                  <td className="px-4 py-3 text-slate-600">
                                    {u.email}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono ${
                                      u.role === 'Head Admin' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                      u.role === 'Registrar Officer' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                      'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUserClick(u)}
                                      disabled={preventDelete}
                                      title={
                                        isSelf ? "You cannot delete your own logged-in account." :
                                        isPrimaryAdmin ? 'Primary system admin "admin001" cannot be deleted.' :
                                        `Delete registrar staff account for ${u.fullName}`
                                      }
                                      className={`p-1 rounded border transition-all inline-flex items-center gap-1 font-bold text-[10px] cursor-pointer ${
                                        preventDelete 
                                          ? 'opacity-40 bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                          : 'text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border-red-200 font-bold'
                                      }`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email templates sub-tab */}
              {adminSettingsSubTab === 'email-templates' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Email Template Configuration Form */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                      <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light text-white p-3.5">
                        <h2 className="font-serif font-bold text-sm flex items-center gap-1.5">
                          <Mail className="w-5 h-5 text-pup-gold" />
                          <span>Customize Student Notification Email</span>
                        </h2>
                        <p className="text-[10px] text-rose-100 mt-0.5 font-medium">
                          Design the layout and wording for verification emails dispatched to students upon document submission.
                        </p>
                      </div>

                      <form onSubmit={handleSaveEmailTemplate} className="p-4 space-y-4">
                        {emailTemplateSaveSuccess && (
                          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-[11px] font-semibold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span>{emailTemplateSaveSuccess}</span>
                          </div>
                        )}
                        {emailTemplateSaveError && (
                          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-[11px] font-semibold leading-normal">
                            {emailTemplateSaveError}
                          </div>
                        )}

                        {/* Email Selection Selector (Specifying which kind of email is being edited) */}
                        <div className="space-y-1.5 bg-slate-50 border border-slate-200/65 p-3 rounded-xl">
                          <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">
                            Active Email Template / Event Trigger
                          </label>
                          <select
                            aria-label="Select email template type"
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:border-pup-maroon transition-all cursor-pointer"
                            defaultValue="receipt-deficiency"
                            onChange={(e) => {
                              if (e.target.value !== 'receipt-deficiency') {
                                alert("Only 'Student Document Receipt & Deficiencies Confirmation' is currently customizable. Other templates use protected system defaults.");
                                e.target.value = 'receipt-deficiency';
                              }
                            }}
                          >
                            <option value="receipt-deficiency">
                              📧 Student Document Receipt & Deficiencies Confirmation (Active)
                            </option>
                            <option value="password-reset">
                              🔒 Registrar Staff Password Reset Notification (System Managed)
                            </option>
                            <option value="weekly-reminder">
                              📅 Weekly Deficiency Reminder Bulletin (Automated)
                            </option>
                          </select>
                          <div className="p-2 bg-rose-50/50 rounded-lg border border-rose-100/40 text-[9px] leading-relaxed text-slate-600">
                            <span className="font-extrabold text-pup-maroon uppercase mr-1">Trigger Event:</span>
                            Dispatched instantly to <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-200">{`{studentEmail}`}</code> whenever a Registrar Officer logs a new submission folder or ticks/unticks a requirement milestone.
                          </div>
                        </div>

                        {/* Subject Format Input */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Email Subject Format <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={emailSubjectTemplate}
                            onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                            placeholder="e.g., [PUP OUS] Document Requirements Received - {trackingId}"
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-pup-maroon focus:border-pup-maroon outline-none transition-all text-slate-800"
                            required
                          />
                          <p className="text-[9px] text-slate-500">
                            Subject line for OUS validation confirmations. Supports placeholders.
                          </p>
                        </div>

                        {/* Plain Text Body Area */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                              Email Body Text template <span className="text-rose-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setEmailBodyTemplate(''); // Resets to default
                                setEmailTemplateSaveSuccess('Template reset to system default view.');
                              }}
                              className="text-[10px] text-pup-maroon font-bold hover:underline cursor-pointer"
                            >
                              Reset to Default
                            </button>
                          </div>
                          <textarea
                            rows={15}
                            value={emailBodyTemplate}
                            onChange={(e) => setEmailBodyTemplate(e.target.value)}
                            placeholder="Enter your plain text email message here, or leave empty to use system default..."
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-lg text-xs font-medium focus:bg-white focus:ring-1 focus:ring-pup-maroon focus:border-pup-maroon outline-none transition-all text-slate-800 leading-relaxed"
                          />
                          <p className="text-[9px] text-slate-500">
                            Write standard text and paragraphs. Separate with double-newlines for paragraphs. Placeholders will be replaced automatically and formatted inside the official PUP OUS styled email container.
                          </p>
                        </div>

                        {/* Available Placeholders Reference Grid */}
                        <div className="bg-slate-50 rounded-lg border border-gray-150 p-3 space-y-2">
                          <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            Available Variable Placeholders
                          </span>
                          <p className="text-[9px] text-slate-500 leading-normal">
                            Click any token below to copy or type it directly in your subject/body format to dynamically inject the corresponding student submission details:
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px]">
                            {[
                              { label: '{studentName}', desc: 'Full student name' },
                              { label: '{trackingId}', desc: 'Tracking Process No' },
                              { label: '{purpose}', desc: 'Academic purpose/intent' },
                              { label: '{schoolYear}', desc: 'Active school year' },
                              { label: '{deliveryMethod}', desc: 'Walk-in or Courier' },
                              { label: '{courierTrackingNumber}', desc: 'Courier reference' },
                              { label: '{receivedDate}', desc: 'Office registration date' },
                              { label: '{receivedDocuments}', desc: 'List of submitted papers' },
                              { label: '{pendingDocuments}', desc: 'List of deficient papers' },
                              { label: '{remarks}', desc: 'Admin feedback remarks' },
                            ].map((token) => (
                              <button
                                key={token.label}
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(token.label);
                                  setEmailTemplateSaveSuccess(`Copied "${token.label}" to clipboard!`);
                                }}
                                className="p-1 rounded bg-white hover:bg-slate-100 border border-gray-200 text-left transition-all cursor-pointer group flex flex-col shrink-0"
                                title={`Click to copy: ${token.desc}`}
                              >
                                <code className="text-pup-maroon font-bold group-hover:text-pup-maroon-dark text-[10px] font-mono">{token.label}</code>
                                <span className="text-[8px] text-slate-500 truncate mt-0.5">{token.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Save Trigger */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={isSavingEmailTemplate}
                            className={`w-full py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                              isSavingEmailTemplate
                                ? 'bg-pup-maroon-light/60 cursor-not-allowed'
                                : 'bg-pup-maroon hover:bg-pup-maroon-dark active:scale-[0.99]'
                            }`}
                          >
                            {isSavingEmailTemplate ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Saving Template Configuration...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Save Template Settings</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Right Column: Dynamic Live Preview */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden flex flex-col h-full min-h-[500px]">
                      <div className="bg-slate-50 border-b border-gray-150 px-4 py-3 shrink-0 flex justify-between items-center">
                        <div>
                          <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                            Live Render Preview
                          </h3>
                          <p className="text-[10px] text-slate-500">
                            See how the template renders with sample student data.
                          </p>
                        </div>
                        <span className="text-[9px] font-bold text-pup-maroon bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
                          Interactive Sandbox
                        </span>
                      </div>

                      {/* Preview Content Area */}
                      <div className="flex-1 p-4 bg-slate-100 overflow-y-auto max-h-[600px]">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
                          {/* Subject banner */}
                          <div className="border-b border-gray-100 pb-3">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Email Subject line:</span>
                            <span className="text-xs font-bold text-slate-800 font-mono">
                              {(emailSubjectTemplate || '[PUP OUS] Document Requirements Received - {trackingId}')
                                .replace(/{trackingId}/g, 'PUPOUS-2026-X9K3L')
                                .replace(/{studentName}/g, 'DELA CRUZ, JUAN R.')
                                .replace(/{purpose}/g, 'Masteral')
                                .replace(/{schoolYear}/g, 'SY 2026-2027')
                              }
                            </span>
                          </div>

                          {/* Email HTML Body content container */}
                          <div className="text-xs leading-normal">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: compileEmailTemplate(
                                  {
                                    id: 'PUPOUS-2026-X9K3L',
                                    timestamp: new Date().toISOString(),
                                    dateString: '2026-07-02',
                                    purpose: 'Masteral',
                                    studentFirstName: 'JUAN',
                                    studentLastName: 'DELA CRUZ',
                                    studentName: 'DELA CRUZ, JUAN R.',
                                    studentEmail: 'juan.delacruz@gmail.com',
                                    contactNumber: '09123456789',
                                    deliveryMethod: 'Courier',
                                    courierTrackingNumber: 'COURIER-123456789',
                                    documents: [],
                                    notified: true,
                                    remarks: 'Please bring your original Transcript of Records (TOR) for verification on your actual interview.'
                                  },
                                  [
                                    { name: 'PUP OUS Application Form', checked: true, required: true },
                                    { name: 'Original Transcript of Records (TOR)', checked: true, required: true },
                                    { name: 'Honorable Dismissal/Transfer Credentials', checked: true, required: true }
                                  ],
                                  [
                                    { name: 'NBI Clearance (Original)', checked: false, required: true },
                                    { name: '4pcs 2x2 colored ID pictures with name tag', checked: false, required: true }
                                  ],
                                  'July 2, 2026',
                                  '/assets/pup-official-seal.png'
                                ).body
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </motion.div>
          )}

          {/* TAB 6: MY ACCOUNT */}
          {activeTab === 'account' && currentUser && (
            <motion.div
              key="account-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-4 max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-2xl p-5 border border-gray-200/85 shadow-xs">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-rose-50 p-3 rounded-full border border-rose-100">
                    <User className="w-6 h-6 text-pup-maroon" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-xl text-gray-900">My Account</h2>
                    <p className="text-[11px] text-gray-500 font-medium">Manage your personal settings and security.</p>
                  </div>
                </div>

                <div className="mb-6 pb-6 border-b border-gray-100">
                  <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-3">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Full Name</span>
                      <span className="text-sm font-semibold text-gray-900">{currentUser.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Username</span>
                      <span className="text-sm font-semibold text-gray-900">{currentUser.username}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Email Address</span>
                      <span className="text-sm font-semibold text-gray-900">{currentUser.email}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">System Role</span>
                      <span className="inline-flex text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-gray-400" /> Security: Change Password
                  </h3>
                  
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                    {changePasswordSuccess && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-xl text-xs font-semibold">
                        {changePasswordSuccess}
                      </div>
                    )}
                    {changePasswordError && (
                      <div className="bg-rose-50 text-rose-800 border border-rose-200 p-3 rounded-xl text-xs font-semibold">
                        {changePasswordError}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                        Current Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-gray-300 rounded-lg py-2.5 px-3 pr-9 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all text-gray-800"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-2.5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                          New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showNewAccountPassword ? "text" : "password"}
                            required
                            value={newAccountPassword}
                            onChange={(e) => setNewAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-gray-300 rounded-lg py-2.5 px-3 pr-9 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewAccountPassword(!showNewAccountPassword)}
                            className="absolute inset-y-0 right-2.5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                            aria-label={showNewAccountPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-1.5 uppercase tracking-wider">
                          Confirm New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmAccountPassword ? "text" : "password"}
                            required
                            value={confirmAccountPassword}
                            onChange={(e) => setConfirmAccountPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-gray-300 rounded-lg py-2.5 px-3 pr-9 text-xs focus:outline-none focus:ring-1 focus:ring-pup-maroon focus:bg-white transition-all text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmAccountPassword(!showConfirmAccountPassword)}
                            className="absolute inset-y-0 right-2.5 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                            aria-label={showConfirmAccountPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmAccountPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="bg-pup-maroon hover:bg-[#660000] text-white font-bold text-xs py-2 px-6 rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* MODAL: CONFIRM STAFF USER DELETION */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-200 flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-[#800000] text-white p-3.5 flex justify-between items-center">
                <span className="font-display font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-pup-gold" />
                  Confirm Account Removal
                </span>
                <button
                  onClick={() => setUserToDelete(null)}
                   aria-label="Close dialog"
                   className="p-1 rounded hover:bg-rose-900 text-rose-100 hover:text-white transition-all cursor-pointer"
              >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewable Area */}
              <div className="p-5 text-center bg-slate-50 space-y-3">
                <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-800">Delete Registrar Account?</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    You are about to delete <span className="font-bold text-gray-700">{userToDelete.fullName}</span> ({userToDelete.username}). This staff member will no longer be able to log in to the OUS PDTS system.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-3.5 border-t border-gray-250 flex justify-end gap-2 text-xs">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="bg-white hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-3.5 rounded border border-gray-300 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteUser}
                  disabled={isDeletingUser}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-1.5 px-3.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingUser ? 'Deleting...' : 'Confirm Delete'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: VIEW PROCESS SLIP */}
      <AnimatePresence>
        {selectedSubmissionForSlip && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-gray-200 flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-pup-maroon text-white p-3 flex justify-between items-center">
                <span className="font-display font-bold text-xs tracking-tight text-white">Process Slip</span>
                <button
                  onClick={() => setSelectedSubmissionForSlip(null)}
                  aria-label="Close process slip"
                  className="p-1 rounded hover:bg-pup-maroon-light text-rose-100 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Viewable Area Wrapper */}
              <div className="p-4 overflow-y-auto flex-1 bg-slate-50">
                <ProcessSlip 
                  submission={selectedSubmissionForSlip} 
                />
              </div>

              {/* Footer */}
              <div className="bg-slate-100 p-3 border-t border-gray-200 text-center text-[11px] text-gray-500 font-bold flex justify-end items-center">
                <button
                  onClick={() => setSelectedSubmissionForSlip(null)}
                  className="bg-pup-maroon hover:bg-pup-maroon-light text-white font-extrabold py-1 px-3 rounded text-[11px] cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: VIEW SENT EMAIL NOTIFICATION */}
      <AnimatePresence>
        {selectedSubmissionForEmail && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-800 flex flex-col max-h-[90vh]"
            >
              
              {/* Modal Header */}
              <div className="bg-pup-maroon text-white p-3 flex justify-between items-center border-b border-pup-maroon-dark">
                <span className="font-display font-bold text-xs tracking-tight text-white">Email Notification Inspector</span>
                <button
                  onClick={() => setSelectedSubmissionForEmail(null)}
                  aria-label="Close process slip"
                  className="p-1 rounded hover:bg-pup-maroon-light text-rose-100 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Email Content Wrapper */}
              <div className="overflow-y-auto flex-1">
                <EmailTemplateView submission={selectedSubmissionForEmail} />
              </div>

              {/* Modal Footer */}
              <div className="bg-pup-maroon-dark p-3 border-t border-pup-maroon-light/20 flex justify-between items-center text-[10px] text-rose-150 font-mono">
                <span>Status: Simulated Send OK via Node Server API</span>
                <button
                  onClick={() => setSelectedSubmissionForEmail(null)}
                  className="bg-white hover:bg-gray-100 text-pup-maroon font-bold py-1 px-3 rounded text-[10px] cursor-pointer"
                >
                  Close
                </button>
              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: IMMEDIATE SUCCESS SPLASH (SHOWS SLIP + EMAIL PREVIEW SIDE-BY-SIDE!) */}
      <AnimatePresence>
        {newSubmissionSuccess && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm">
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-pup-maroon-dark rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden border border-pup-maroon-light/30 flex flex-col max-h-[92vh]"
            >
              
              {/* Splash Modal Header */}
              <div className="bg-gradient-to-r from-pup-maroon to-pup-maroon-light text-white p-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pup-gold/20 flex items-center justify-center text-pup-gold">
                    <CheckCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-xs tracking-tight">
                      Successfully Saved! Reference Generated: <span className="text-pup-gold font-mono">{newSubmissionSuccess.id}</span>
                    </h3>
                    <p className="text-[10px] text-rose-100 leading-none">
                      The email notification has been sent to the student.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setNewSubmissionSuccess(null)}
                  aria-label="Close success dialog"
                  className="bg-slate-950/40 hover:bg-slate-950/60 p-1.5 rounded-lg text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Side-by-Side Content */}
              <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#2e0000]">
                
                {/* Left Side: Process Slip */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    📄 OFFICIAL PROCESS SLIP
                  </div>
                  <ProcessSlip 
                    submission={newSubmissionSuccess} 
                  />
                </div>

                {/* Right Side: Email Notification Preview (The design the manager wants to review) */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    📧 SENT EMAIL NOTIFICATION PREVIEW
                  </div>
                  <EmailTemplateView submission={newSubmissionSuccess} />
                </div>

              </div>

              {/* Splash Modal Footer */}
              <div className="bg-pup-maroon-dark px-4 py-2.5 border-t border-pup-maroon-light/20 flex justify-end items-center shrink-0">
                <button
                  onClick={() => setNewSubmissionSuccess(null)}
                  className="bg-[#800000] hover:bg-[#9d1c1c] text-white font-display font-black text-xs px-5 py-2 rounded-lg shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Start New Entry</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* 7. Beautiful Institutional Footer */}
      <footer className="bg-pup-maroon-dark border-t border-pup-maroon-light/25 text-rose-100/70 py-4 text-center shrink-0 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-extrabold text-slate-300 text-[10px]">POLYTECHNIC UNIVERSITY OF THE PHILIPPINES • OPEN UNIVERSITY SYSTEM</p>
          <p className="text-[9px] leading-relaxed text-slate-400 font-medium">
            Admission & Academic Requirement Monitoring Ledger Tool. Developed for the OUS Admin Staff.
          </p>
          <p className="text-[9px] text-slate-500 font-mono">
            &copy; {new Date().getFullYear()} PUPOUS Document Tracking System. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
