import os
import re
import json

def to_camel_case(text):
    # Remove non-alphanumeric, split by spaces
    words = re.sub(r'[^a-zA-Z0-9 ]', '', text).split()
    if not words:
        return "emptyKey"
    return words[0].lower() + ''.join(w.capitalize() for w in words[1:])[:20]

def process_files(directories):
    en_dict = {}
    sw_dict = {} # We'll populate this later or leave it as english for me to manually translate in the script
    
    files_to_modify = []
    
    for directory in directories:
        for root, _, files in os.walk(directory):
            for file in files:
                if file.endswith('.dart'):
                    files_to_modify.append(os.path.join(root, file))
                    
    # Regexes to find strings in Text('...'), label: '...', title: '...'
    patterns = [
        (r"(Text\(\s*)'([^'\$]+)'", "text_"),
        (r"(label:\s*)'([^'\$]+)'", "label_"),
        (r"(title:\s*)'([^'\$]+)'", "title_"),
        (r"(subtitle:\s*)'([^'\$]+)'", "subtitle_"),
        (r"(hintText:\s*)'([^'\$]+)'", "hint_"),
        (r"(tooltip:\s*)'([^'\$]+)'", "tooltip_"),
        (r"(message:\s*)'([^'\$]+)'", "msg_"),
    ]
    
    for file_path in files_to_modify:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        original_content = content
        
        # We need to make sure AppLocalizations is imported and l10n is available.
        # But injecting `final l10n = AppLocalizations.of(context);` into every build method is hard with regex.
        # Alternative: use `AppLocalizations.of(context)?.key ?? 'Default'` directly.
        # Wait, if `context` is not in scope, it breaks!
        
        # We will just do a simple replacement for now.
        for prefix_regex, key_prefix in patterns:
            matches = re.finditer(prefix_regex, content)
            for match in matches:
                full_match = match.group(0)
                prefix = match.group(1)
                text = match.group(2)
                
                # Skip very short strings or single characters, or pure numbers
                if len(text) < 2 or text.isdigit():
                    continue
                
                # Generate key
                key = key_prefix + to_camel_case(text)
                
                # If key exists with different text, append a number
                base_key = key
                counter = 1
                while key in en_dict and en_dict[key] != text:
                    key = f"{base_key}{counter}"
                    counter += 1
                
                en_dict[key] = text
                
                # Replace in content
                # To avoid issues with missing `context`, we'll try to use a global navigator key or just assume `context` exists.
                # In build methods, `context` is always named `context`.
                # If it's outside, it will break. We'll risk it and fix errors if they arise.
                replacement = f"{prefix}(AppLocalizations.of(context)?.{key} ?? '{text}')"
                content = content.replace(full_match, replacement)
                
        if content != original_content:
            # Add import if needed
            if "AppLocalizations" not in content:
                # Find last import
                last_import_idx = content.rfind("import '")
                if last_import_idx != -1:
                    end_of_line = content.find("\n", last_import_idx)
                    content = content[:end_of_line] + "\nimport 'package:flutter_gen/gen_l10n/app_localizations.dart';" + content[end_of_line:]
                else:
                    content = "import 'package:flutter_gen/gen_l10n/app_localizations.dart';\n" + content
                    
            # Wait, our import path must be relative because of the synthetic-package issue!
            # It's better to use an absolute-ish import if possible, or just relative.
            # `import 'package:kalro/l10n/app_localizations.dart';` wait, the package name is kalro? No, kalro_app?
            # Let's read pubspec.yaml to get the package name.
            pass
            
    # For now, let's just dump the extracted strings so we can see them.
    with open('extracted_en.json', 'w') as f:
        json.dump(en_dict, f, indent=2)

process_files(['lib/screens', 'lib/components'])
print("Done extracting.")
