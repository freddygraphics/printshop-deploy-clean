"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useUnsavedChanges({ onSaveDraft, enabled = true } = {}) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const pendingNavigationRef = useRef(null);
  const allowLeaveRef = useRef(false);
  const hasUnsavedChangesRef = useRef(false);

  // ======================================================
  // KEEP REF SYNCED
  // ======================================================
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // ======================================================
  // MARK DIRTY
  // ======================================================
  const markUnsaved = useCallback(() => {
    if (!enabled) return;

    hasUnsavedChangesRef.current = true;
    setHasUnsavedChanges(true);
  }, [enabled]);

  // ======================================================
  // MARK SAVED
  // ======================================================
  const markSaved = useCallback(() => {
    hasUnsavedChangesRef.current = false;
    setHasUnsavedChanges(false);
  }, []);

  // ======================================================
  // ACTUALLY LEAVE
  // ======================================================
  const performNavigation = useCallback((destination) => {
    allowLeaveRef.current = true;

    if (!destination) return;

    // Browser back
    if (destination.type === "back") {
      window.history.back();
      return;
    }

    // URL normal
    if (destination.type === "url" && destination.url) {
      window.location.href = destination.url;
    }
  }, []);

  // ======================================================
  // REQUEST NAVIGATION MANUALLY
  // ======================================================
  const requestNavigation = useCallback(
    (url) => {
      if (!url) return;

      if (allowLeaveRef.current || !enabled || !hasUnsavedChangesRef.current) {
        allowLeaveRef.current = true;
        window.location.href = url;
        return;
      }

      pendingNavigationRef.current = {
        type: "url",
        url,
      };

      setShowUnsavedDialog(true);
    },
    [enabled],
  );

  // ======================================================
  // CLOSE DIALOG
  // ======================================================
  const closeUnsavedDialog = useCallback(() => {
    setShowUnsavedDialog(false);
    pendingNavigationRef.current = null;
  }, []);

  // ======================================================
  // DISCARD AND LEAVE
  // ======================================================
  const handleDiscardAndLeave = useCallback(() => {
    const destination = pendingNavigationRef.current;

    markSaved();
    setShowUnsavedDialog(false);
    pendingNavigationRef.current = null;

    performNavigation(destination);
  }, [markSaved, performNavigation]);

  // ======================================================
  // SAVE DRAFT AND LEAVE
  // ======================================================
  const handleSaveDraftAndLeave = useCallback(async () => {
    if (isSavingDraft) return;

    try {
      setIsSavingDraft(true);

      if (typeof onSaveDraft === "function") {
        await onSaveDraft();
      }

      const destination = pendingNavigationRef.current;

      markSaved();
      setShowUnsavedDialog(false);
      pendingNavigationRef.current = null;

      performNavigation(destination);
    } catch (error) {
      console.error("❌ Error saving draft before leaving:", error);

      alert(
        error instanceof Error ? error.message : "Could not save the document.",
      );
    } finally {
      setIsSavingDraft(false);
    }
  }, [isSavingDraft, onSaveDraft, markSaved, performNavigation]);

  // ======================================================
  // RELOAD / CLOSE TAB / CLOSE BROWSER
  //
  // Browsers do NOT allow our custom React dialog here.
  // They display their native unsaved-changes warning.
  // ======================================================
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event) => {
      if (allowLeaveRef.current || !hasUnsavedChangesRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled]);

  // ======================================================
  // INTERCEPT <a href=""> LINKS
  //
  // This catches navigation from sidebar, header, menus, etc.
  // ======================================================
  useEffect(() => {
    if (!enabled) return;

    const handleDocumentClick = (event) => {
      if (allowLeaveRef.current || !hasUnsavedChangesRef.current) {
        return;
      }

      // Ignore modified clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = event.target.closest?.("a[href]");

      if (!anchor) return;

      const href = anchor.getAttribute("href");

      if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
        return;
      }

      // New tabs should not navigate away from this page
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      let destination;

      try {
        destination = new URL(href, window.location.href);
      } catch {
        return;
      }

      // Ignore same exact page
      if (destination.href === window.location.href) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      pendingNavigationRef.current = {
        type: "url",
        url: destination.href,
      };

      setShowUnsavedDialog(true);
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [enabled]);

  // ======================================================
  // BROWSER BACK BUTTON
  // ======================================================
  useEffect(() => {
    if (!enabled) return;

    // Add a guard history entry while editing.
    window.history.pushState(
      { unsavedChangesGuard: true },
      "",
      window.location.href,
    );

    const handlePopState = () => {
      if (allowLeaveRef.current || !hasUnsavedChangesRef.current) {
        return;
      }

      // Keep user on current page while dialog is open.
      window.history.pushState(
        { unsavedChangesGuard: true },
        "",
        window.location.href,
      );

      pendingNavigationRef.current = {
        type: "back",
      };

      setShowUnsavedDialog(true);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [enabled]);

  return {
    hasUnsavedChanges,

    showUnsavedDialog,
    setShowUnsavedDialog,

    isSavingDraft,

    pendingNavigationRef,
    allowLeaveRef,

    markUnsaved,
    markSaved,

    requestNavigation,
    closeUnsavedDialog,

    handleSaveDraftAndLeave,
    handleDiscardAndLeave,
  };
}
