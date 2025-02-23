import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,  
        ...globals.jest    
      },
    },
    rules: {
      "no-undef": "off",          
      "no-unused-vars": "off",   // ✅ Fully disable this rule
      "no-console": "off",       
      "no-debugger": "off",      
      "strict": "off",           
    },
  },
  {
    rules: {
      "no-unused-vars": "off"  // ✅ Ensure it is disabled even after plugin configs
    }
  },
  pluginJs.configs.recommended,  // 👈 ESLint recommended settings (may override rules)
];