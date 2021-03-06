/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

'use strict';

import { scm, Uri, Disposable, SCMProvider, SCMResourceGroup, Event, ProviderResult, workspace } from 'vscode';
import { Model, Resource, ResourceGroup, State } from './model';
import { CommandCenter } from './commands';
import { mapEvent } from './util';

export class GitSCMProvider implements SCMProvider {

	private disposables: Disposable[] = [];

	get resources(): SCMResourceGroup[] { return this.model.resources; }

	get onDidChange(): Event<SCMResourceGroup[]> {
		return mapEvent(this.model.onDidChange, () => this.model.resources);
	}

	get label(): string { return 'Git'; }

	get state(): string {
		switch (this.model.state) {
			case State.Uninitialized: return 'uninitialized';
			case State.Idle: return 'idle';
			case State.NotAGitRepository: return 'norepo';
			default: return '';
		}
	}

	get count(): number {
		const countBadge = workspace.getConfiguration('git').get<string>('countBadge');

		switch (countBadge) {
			case 'off': return 0;
			case 'tracked': return this.model.indexGroup.resources.length;
			default: return this.model.resources.reduce((r, g) => r + g.resources.length, 0);
		}
	}

	constructor(private model: Model, private commandCenter: CommandCenter) {
		scm.registerSCMProvider('git', this);
	}

	open(resource: Resource): ProviderResult<void> {
		return this.commandCenter.open(resource);
	}

	drag(resource: Resource, resourceGroup: ResourceGroup): void {
		console.log('drag', resource, resourceGroup);
	}

	getOriginalResource(uri: Uri): Uri | undefined {
		if (uri.scheme !== 'file') {
			return;
		}

		return uri.with({ scheme: 'git' });
	}

	dispose(): void {
		this.disposables.forEach(d => d.dispose());
		this.disposables = [];
	}
}