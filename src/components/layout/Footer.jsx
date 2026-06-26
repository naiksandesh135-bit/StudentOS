import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm">
      <p>Built by Sandesh Naik • <a href="mailto:example@example.com" className="underline">Email</a></p>
      <a
        href="https://digitalheroesco.com"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block mt-2 text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Built for Digital Heroes
      </a>
    </footer>
  );
}
