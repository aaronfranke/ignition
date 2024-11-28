import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { KeyFileUtils, Signal } from './utils.js';

export class AutostartEntry {
	get name() {
		return KeyFileUtils.get_string_safe(this.keyfile, true, "Desktop Entry", "Name", "");
	}

	get comment() {
		return KeyFileUtils.get_string_safe(this.keyfile, true, "Desktop Entry", "Comment", "");
	}

	get exec() {
		return KeyFileUtils.get_string_safe(this.keyfile, false, "Desktop Entry", "Exec", "");
	}

	get terminal() {
		return KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "Terminal", false);
	}

	get enabled() {
		return ! KeyFileUtils.get_boolean_safe(this.keyfile, "Desktop Entry", "Hidden", false);
	}

	get icon() {
		return KeyFileUtils.get_string_safe(this.keyfile, false, "Desktop Entry", "Icon", "");
	}

	set name(value) {
		this.keyfile.set_locale_string("Desktop Entry", "Name", this.locale, value);
	}

	set comment(value) {
		this.keyfile.set_locale_string("Desktop Entry", "Comment", this.locale, value);
	}

	set exec(value) {
		this.keyfile.set_string("Desktop Entry", "Exec", value);
	}

	set terminal(value) {
		this.keyfile.set_boolean("Desktop Entry", "Terminal", value);
	}

	set enabled(value) {
		this.keyfile.set_boolean("Desktop Entry", "Hidden", ! value);
	}

	set icon(value) {
		this.keyfile.set_string("Desktop Entry", "Icon", value);
	}

	save() {
		try {
			// Add key values that might be missing, but won't be edited
			this.keyfile.set_int64("Desktop Entry", "X-GNOME-Autostart-Delay", 60);
			this.keyfile.set_string("Desktop Entry", "Type", "Application");

			this.keyfile.save_to_file(this.path);
			this.signals.file_saved.emit();
		} catch (error) {
			print("\nERROR! Could not save entry's keyfile:");
			print(error);
			this.signals.file_trash_failed.emit(error);
		}
	}

	path;
	keyfile = new GLib.KeyFile({});
	file;
	locale = "en_US";
	signals = {
		file_saved: new Signal(this),
		file_save_failed: new Signal(this),
		file_trashed: new Signal(this),
		file_trash_failed: new Signal(this),
	};

	constructor(path) {
		this.path = path;
		this.file = Gio.File.new_for_path(path);
		if (this.file.query_exists(null)) {
			try {
				this.keyfile.load_from_file(this.path, GLib.KeyFileFlags.KEEP_TRANSLATIONS);
				try {
					this.locale = this.keyfile.get_locale_for_key("Desktop Entry", "Name", null) || "en_US";
				} catch (error) {
					print(error);
				}
			} catch (error) {
				print("\nERROR! loading keyfile file:");
				print(error);
			}
		}
	}
}
