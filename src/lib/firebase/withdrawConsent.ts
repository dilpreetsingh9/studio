
'use client';

/**
 * @fileOverview Jeiva Consent Withdrawal Stub
 * 
 * Satisfies DPDPA 2023 / PHIPPA requirements to allow easy consent withdrawal
 * while maintaining an immutable audit trail of the withdrawal event.
 */

import { Firestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Logs a withdrawal event. Does not delete historical logs (audit requirement).
 */
export function withdrawConsent(db: Firestore, userId: string): void {
  const colRef = collection(db, 'users', userId, 'consentLogs');

  const data = {
    userId,
    withdrawalTimestamp: serverTimestamp(),
    type: "withdrawal",
    initiatedBy: "user",
    note: "User withdrew consent via app Settings"
  };

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
