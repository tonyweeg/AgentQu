/**
 * File Drop Context
 * Carried - Motions carry, memory too
 *
 * Allows passing dropped files between pages
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface FileDropContextType {
  pendingFile: File | null;
  setPendingFile: (file: File | null) => void;
}

const FileDropContext = createContext<FileDropContextType>({
  pendingFile: null,
  setPendingFile: () => {},
});

export function FileDropProvider({ children }: { children: ReactNode }) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  return (
    <FileDropContext.Provider value={{ pendingFile, setPendingFile }}>
      {children}
    </FileDropContext.Provider>
  );
}

export function useFileDrop() {
  return useContext(FileDropContext);
}
