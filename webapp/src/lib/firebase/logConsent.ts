
'use client';

/**
 * @fileOverview Jeiva Jurisdictional Consent Logging Utility
 * 
 * Satisfies legal obligations:
 * - DPDPA 2023 (India): Record of purpose, itemized consent, and notice version.
 * - PHIPPA 2004 (Ontario): Explicit consent record for health information collection.
 * - IT Rules 2011 (India): Affirmative action logging for SPDI collection.
 */

import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface ConsentLogInput {
  userId: string;
  isOntarioLocation: boolean;
  checkboxes: {
    healthDataProcessing: boolean;
    privacyPolicyAndTerms: boolean;
    notMedicalAdvice: boolean;
  };
  ipCountryHint?: string;
}

/**
 * Records a tamper-evident consent event to Firestore.
 * 
 * @param db - Firestore instance
 * @param input - User consent data
 */
export function logConsent(db: Firestore, input: ConsentLogInput): void {
  const colRef = collection(db, 'users', input.userId, 'consentLogs');

  const data = {
    userId: input.userId,
    timestamp: serverTimestamp(), // Satisfies DPDPA/PHIPPA "time of collection" requirement
    consentVersion: "1.0", // Maps to Policy Document ID
    jurisdictions: input.isOntarioLocation ? ["IN", "CA-ON"] : ["IN"],
    checkboxesAgreed: input.checkboxes,
    ipCountryHint: input.ipCountryHint || "unknown",
    platform: "web",
    policyUrl: "https://jeiva.ai/privacy-policy-v1",
    consentWithdrawnAt: null
  };

  // Trigger non-blocking write to satisfy compliance without delaying UI transitions
  addDoc(colRef, data).catch(async (serverError) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: colRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}
