# Changelog

All notable changes to this project (developed by the USAS STEM Club) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
* Full 4-language support for English (default), Bahasa Melayu, Simplified Chinese (zh), and Tamil (ta).
* Custom glassmorphic language selection dropdown in top navigation.
* Five distinct timetable themes (Dark, Light, OLED, Emerald, and Warm Amber).
* Cloudflare Turnstile Captcha integration on login form.
* Complete project documentation suite following open-source repository standards.

### Fixed
* Fixed export progress overlay hang after file generation.
* Eliminated sub-pixel typography vibration and jitter on 3D card tilt unfocus.
* Eliminated landing page flash during authenticated page reload.
* Resolved subject code resolution fallbacks between kod_kursus and course_id.
* Updated Playwright e2e test locators for multi-language compatibility.

### Changed
* Refactored top navigation with custom language dropdown selector.
* Standardized theme name to Dark Theme without Navy suffix.
* Upgraded standalone error pages (404, 500, 502, 503, 504) with dark glassmorphic styling and USAS emblem.
* Locked browser tab header strictly to USAS Class Timetable.
