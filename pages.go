/*
 * Copyright © 2018-2019, 2021 Musing Studio LLC.
 *
 * This file is part of WriteFreely.
 *
 * WriteFreely is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, included
 * in the LICENSE file in this source code package.
 */

package writefreely

import (
	"database/sql"
	"time"

	"github.com/writefreely/writefreely/config"
)

var defaultPageUpdatedTime = time.Date(2018, 11, 8, 12, 0, 0, 0, time.Local)

func getAboutPage(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("about")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "about",
			Type:    "page",
			Content: defaultAboutPage(app.cfg),
		}
	}
	if !c.Title.Valid {
		c.Title = defaultAboutTitle(app.cfg)
	}
	return c, nil
}

func defaultAboutTitle(cfg *config.Config) sql.NullString {
	return sql.NullString{String: "About " + cfg.App.SiteName, Valid: true}
}

func getContactPage(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("contact")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "contact",
			Type:    "page",
			Content: defaultContactPage(app),
		}
	}
	if !c.Title.Valid {
		c.Title = defaultContactTitle()
	}
	return c, nil
}

func defaultContactTitle() sql.NullString {
	return sql.NullString{String: "Contact Us", Valid: true}
}

func getPrivacyPage(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("privacy")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "privacy",
			Type:    "page",
			Content: defaultPrivacyPolicy(app.cfg),
			Updated: defaultPageUpdatedTime,
		}
	}
	if !c.Title.Valid {
		c.Title = defaultPrivacyTitle()
	}
	return c, nil
}

func defaultPrivacyTitle() sql.NullString {
	return sql.NullString{String: "Privacy Policy", Valid: true}
}

func defaultAboutPage(cfg *config.Config) string {
	return `_` + cfg.App.SiteName + `_ is a free, community-run home for original stories, comics, romance, thrillers, fantasy, and every other kind of writing.

Readers can discover work through genres and tags. Writers keep ownership of their work and can export it whenever they choose.

This community is powered by [WriteFreely](https://writefreely.org), free software released under the AGPLv3 license. The person running this instance is responsible for its rules, moderation, backups, and privacy practices.`
}

func defaultContactPage(app *App) string {
	c, err := app.db.GetCollectionByID(1)
	if err != nil {
		return ""
	}
	return `_` + app.cfg.App.SiteName + `_ is administered by: [**` + c.Alias + `**](/` + c.Alias + `/).

To report copyright concerns, harassment, unsafe material, or content that may be inappropriate for children, contact the administrator at: _ADD A MODERATION EMAIL ADDRESS HERE_.

Do not include private information about anyone in a report. The administrator should acknowledge urgent child-safety reports promptly and follow applicable law.`
}

func defaultPrivacyPolicy(cfg *config.Config) string {
	return `This is a starter privacy notice for **` + cfg.App.SiteName + `**. The site administrator must replace it with an accurate policy before inviting the public.

[WriteFreely](https://writefreely.org), the software that powers this site, is designed to minimize data collection. Accounts may be created without an email address. If an email is provided, it is stored encrypted; passwords are salted and hashed. The service uses cookies to keep people signed in and may retain server logs for security and troubleshooting.

Story posts, public profiles, and public comments can be visible to other readers. Do not post another person's private information. The administrator must state where data is hosted, how long it is kept, who can access it, how to request deletion, and a contact email.

This free edition does not use paid AI or a recommendation tracker by default. Stories are discovered through public genres, tags, and the local timeline. Software cannot replace responsible administration: privacy and safety ultimately depend on the people operating this instance.`
}

func getLandingBanner(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("landing-banner")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "landing-banner",
			Type:    "section",
			Content: defaultLandingBanner(app.cfg),
			Updated: defaultPageUpdatedTime,
		}
	}
	return c, nil
}

func getLandingBody(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("landing-body")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "landing-body",
			Type:    "section",
			Content: defaultLandingBody(app.cfg),
			Updated: defaultPageUpdatedTime,
		}
	}
	return c, nil
}

func defaultLandingBanner(cfg *config.Config) string {
	return "# Stories worth sharing"
}

func defaultLandingBody(cfg *config.Config) string {
	return `## Write freely. Read safely.

Storyloom is a community for original fiction, comics, serialized writing, and essays. Explore stories through clear genre tags such as **romance**, **thriller**, **comic**, **fantasy**, and **literary**.

## A community, not an algorithm

Discovery here is simple and transparent: browse the reader timeline, follow writers you enjoy, and explore tags. We do not use a paid AI service or sell reading history to rank stories.

## Keep it welcoming

Publish only work you have the right to share. Do not post harassment, private personal information, illegal material, or sexual content involving minors. Mark mature work clearly and keep it out of spaces intended for younger readers. Report concerns to the site administrator.`
}

func getReaderSection(app *App) (*instanceContent, error) {
	c, err := app.db.GetDynamicContent("reader")
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &instanceContent{
			ID:      "reader",
			Type:    "section",
			Content: defaultReaderBanner(app.cfg),
			Updated: defaultPageUpdatedTime,
		}
	}
	if !c.Title.Valid {
		c.Title = defaultReaderTitle(app.cfg)
	}
	return c, nil
}

func defaultReaderTitle(cfg *config.Config) sql.NullString {
	return sql.NullString{String: "Discover stories", Valid: true}
}

func defaultReaderBanner(cfg *config.Config) string {
	return "Read the latest public stories from " + cfg.App.SiteName + ". Browse by genre tags, follow writers you enjoy, and report anything that breaks the community rules."
}
