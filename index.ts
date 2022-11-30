
import MultiMap from "@github/multimap";

type Ref<Type, asString extends boolean> = asString extends true ? string : Type;

interface Experiment<useRefs extends boolean> {
	version: { major: uint, minor: uint, patch: uint, };
	settings: {
		allowPipetReuse: boolean;
	};
	models: ModelGroup<useRefs>[];
	materials: Material<useRefs>[];
	jobs: Job<useRefs>[];
	plates: WellPlate<useRefs>[];
}

interface Job<useRefs extends boolean> {
	scheduled: null | { at: uint, on: string, };
	inputs: MaterialSource<useRefs>[];
	premixes: Premix<useRefs>[];
	instructions: Instruction<useRefs>[];
}

type WellType = (typeof WellTypes)[keyof (typeof WellTypes)];
const WellTypes = {
	med96: { id: 'med96', width: 12, height: 8, size: 42, },
};

interface WellPlate<useRefs extends boolean> {
	type: WellType;
	models: Ref<ModelGroup<useRefs>, useRefs>[];
	wells: (null|{
		model: Ref<ModelGroup<useRefs>, useRefs>;
		index: uint;
	})[];
}

type uint = number;

interface ModelGroup<useRefs extends boolean> {
	name: string;
	wellType: WellType;
	count: uint;
	operations: ModelOperation<useRefs>[][];
	instructions: Ref<ModelInstruction<useRefs>, useRefs>[];
}

type ModelOperation<useRefs extends boolean> = (AddMaterialsOp<useRefs> | SetTempOp<useRefs> | RemoveMaterialOp<useRefs> | MixOp<useRefs> | PauseOp<useRefs> | ModuleOp<useRefs> | ExternalOp<useRefs>) & {
	type: string;
	allowSlack: boolean;
}

interface AddMaterialsOp<useRefs extends boolean> {
	type: 'AddMaterials';
	materials: {
		type: Ref<Material<useRefs>, useRefs>;
		volume: uint;
	}[];
}
interface SetTempOp<useRefs extends boolean> {
	type: 'SetTemp';
}
interface RemoveMaterialOp<useRefs extends boolean> {
	type: 'RemoveMaterial';
}
interface MixOp<useRefs extends boolean> {
	type: 'Mix';
}
interface PauseOp<useRefs extends boolean> {
	type: 'Pause';
}
interface ModuleOp<useRefs extends boolean> {
	type: 'Module';
}
interface ExternalOp<useRefs extends boolean> {
	type: 'External';
}

interface InstructionBase<useRefs extends boolean> {
	type: string;
	allowSlack: boolean;
}
type Instruction<useRefs extends boolean> = (InstructionBase<useRefs> & (ModuleInst<useRefs> | PremixInst<useRefs>)) | ModelInstruction<useRefs>;

interface ModuleInst<useRefs extends boolean> {
	type: 'Module';
}
interface PremixInst<useRefs extends boolean> {
	type: 'Premix';
}

interface ModelInstructionBase<useRefs extends boolean> extends InstructionBase<useRefs> {
	model: Ref<ModelGroup<useRefs>, useRefs>;
	wellPlate: Ref<WellPlate<useRefs>, useRefs>;
	indices: { model: uint, well: uint }[];
}
type ModelInstruction<useRefs extends boolean> = ModelInstructionBase<useRefs> & (UnorderedInst<useRefs> | AddMaterialInst<useRefs> | SetTempInst<useRefs> | RemoveMaterialInst<useRefs> | MixInst<useRefs> | PauseInst<useRefs> | ExternalInst<useRefs>);

interface UnorderedInst<useRefs extends boolean> {
	type: 'Unordered';
	instructions: ModelInstruction<useRefs>[];
}
interface AddMaterialInst<useRefs extends boolean> {
	type: 'AddMaterial';
	source: MaterialSource<useRefs>;
}
interface SetTempInst<useRefs extends boolean> {
	type: 'SetTemp';
}
interface RemoveMaterialInst<useRefs extends boolean> {
	type: 'RemoveMaterial';
}
interface MixInst<useRefs extends boolean> {
	type: 'Mix';
}
interface PauseInst<useRefs extends boolean> {
	type: 'Pause';
}
interface ExternalInst<useRefs extends boolean> {
	type: 'External';
}

interface MaterialSource<useRefs extends boolean> {
	mix: { material: Ref<Material<useRefs>, useRefs>, percent: number, }[];
	location: InputTube;
}

interface Premix<useRefs extends boolean> {
	mix: { material: Ref<Material<useRefs>, useRefs>, percent: number, }[];
	location: null | InputTube;
	required: null | { from: Ref<Instruction<useRefs>, useRefs>, till: Ref<Instruction<useRefs>, useRefs>, };
}

interface Material<useRefs extends boolean> {
	/** Unique ID of this material<useRefs>. Since this should preferably be unique across ... everything, it should preferably be a (auto computed) hash over everything. (Really what we need is to be able to recognize same materials and de-duplicate them.) */
	id: string;
	name: string;
	/** Some measure for how much stress the material<useRefs> can take, before it takes damage of some sort. The stress depends on toe tools used, the speed they are operated at, and maybe other factors. This should mostly be relevant for cell suspensions. */
	maxSheerPressure?: number;
	/** How soon the material<useRefs> becomes stale. This may need to take the size and type of vessel it is in into account. And we'll additionally need to specify how to make it unstale / when the counter starts. This should mostly be relevant for cell suspensions. */
	sedimentationTime?: number;
	viscosity: number;
	/** May need this to transform volume to mass. */
	density: number;
	/** If this material<useRefs> is a hydrogel that is temperature-linkable, a temperature profile to link it. This would be used to suggest it to the user. Semantic of each entry is "oder the next ${duration} ms linearly change temp from what it currently is to ${target} degK". */
	tempLink?: { duration: uint; target: uint; }[];
	/** If this material<useRefs> is a hydrogel that is UV-linkable, then these are recommended settings for the UV linking module. */
	uvLink?: {
		duration: uint;
		light: { wavelength: uint; intensity: uint; }[];
	};
	/** List of groups of materials to suggest if this one is used. Grouped to aviod suggesting materials where a substitute is already used. Might want to make these some sort of filter instead of explicitly referencing other materials. */
	suggestedMaterials?: Ref<Material<useRefs>, useRefs>[][];
}

interface InputTube {
	index: number;
}

const example: Experiment<true> = {
	version: { major: 0, minor: 0, patch: 0, },
	settings: {
		allowPipetReuse: true,
	},
	models: [ {
		name: 'g1',
		wellType: WellTypes.med96,
		count: 16,
		operations: [
			[ {
				type: 'AddMaterials',
				allowSlack: true,
				materials: [ {
					type: '1',
					volume: 42,
				}, ],
			}, ],
		],
		instructions: [ ],
	}, ],
	materials: [ {
		id: 'hg1',
		name: 'My super cool hydrogel.',
		viscosity: 42,
		density: 0.942,
		uvLink: {
			duration: 2500,
			light: [ { wavelength: 230, intensity: 300, }, ],
		},
		suggestedMaterials: [ [ 'pbs1', ], [ 'pi1', ], ],
	}, {
		id: 'pbs1',
		name: 'Basically water',
		viscosity: 0,
		density: 1,
	}, {
		id: 'pbs2',
		name: 'Heavy water',
		viscosity: 0,
		density: 1.1,
	}, {
		id: 'pi1',
		name: 'The special sauce',
		viscosity: 0,
		density: 1,
		suggestedMaterials: [ [ 'hg1', ], ],
	}, ],
	jobs: [ {
		scheduled: null,
		inputs: [ {
			mix: [ { material: 'hg1', percent: 20, }, { material: 'pbs1', percent: 80, }, ],
			location: { index: 1, },
		}, {
			mix: [ { material: 'pbs1', percent: 100, }, ],
			location: { index: 2, },
		}, {
			mix: [ { material: 'pi1', percent: 100, }, ],
			location: { index: 3, },
		}, ],
		premixes: [ ],
		instructions: [ ],
	}, ],
	plates: [ ],
};

function materialsAreCompatible(materialsList: Material<false>[][], constraints: any) {
	if (constraints != null) { throw new TypeError('not implemented'); }
	if (materialsList.length < 2) { return true; }
	const ref = materialsList.pop()?.map(_=>_.id).sort().join(":");
	return materialsList.every(_=>_.map(_=>_.id).sort().join(":") == ref);
}

function hashThings(things: { [key:string]: any, }[], excludeKeys: string[] | ((key: string) => boolean) = () => false) {
	if (Array.isArray(excludeKeys)) { excludeKeys = [].includes.bind(excludeKeys); }
	const hash = require('crypto').createHash('md5');
	for (const thing of things) {
		hash.update(JSON.stringify(thing, (key, value) => (excludeKeys as Function)(key) ? undefined : value))
	}
	return hash.digest("hex");
}

function resolveReferences(experiment: Experiment<true>): Experiment<false> {
	const root = JSON.parse(JSON.stringify(experiment));
	resolve(root, [ 'instructions', '*', 'model', '*', ], 'models');
	resolve(root, [ 'instructions', '*', 'wellPlate', '*', ], 'plates');
	resolve(root, [ 'models', '*', 'instructions', '*', ], 'instructions');
	resolve(root, [ 'plates', '*', 'models', '*', ], 'models');
	resolve(root, [ 'plates', '*', 'wells', '*', '*?', 'model', ], 'models');
	return root;
	function resolve(root: any, at: string[], from: string, trace: string[] = [ ]) {
		let key = at.shift()!; const optional = key.endsWith('?'); if (optional) { key = key.slice(0, -1); } const last = at.length == 0; trace.push(key);
		function exists(key: string|number) {
			if (root[key] != null) { return true; }
			if (optional) { return false; }
			throw new Error(`Could not resolve reference at/past ${trace.join('.')}.${key} (it is null/undefined)`);
		}
		if (key == '*') { if (last) {
			(root as any[]).splice(0, Infinity, (root as any[]).map((_, key) => (typeof root[key] == 'string') ? experiment[from][root[key]] : (exists(key), root[key])));
		} else {
			(root as any[]).forEach((_, key) => exists(key) && resolve(root[key], at, from, trace.concat('*')));
		} } else { if (exists(key)) { if (last) {
			if (typeof root[key] == 'string') { root[key] = experiment[from][root[key]]; }
		} } else {
			resolve(root[key], at, from, trace.concat(key));
		} }
	}
}

function autoPlaceModels(experiment: Experiment<false>): void {
	experiment.plates = [ ]; const { plates, } = experiment;
	experiment.instructions = [ ];
	const byExtOps = new MultiMap<string, ModelGroup<false>>();
	for (const model of experiment.models) {
		const key = hashThings([ model.wellType as any, ].concat(model.operations.filter(op => op.type == 'Module' || op.type == 'External')), [ 'suggestedMaterials', ]);
		// TODO: can't completely ignore previous operations that have »allowSlack = false« or the next option if any of these have the same set.
		byExtOps.set(key, model);
	}
	for (const compat of byExtOps.values()) {
		// Now for each set of compatible model groups, we need to solve (or approximate a solution for) the "max-sum multiple subset sum problem", for as small a number of subsets.
		const sorted = Array.from(compat).sort((a, b) => b.count - a.count);
		while (sorted.length) {
			const type = sorted[0].wellType, wellCount = type.height * type.width; let addAt = 0;
			const plate: WellPlate<false> = { type, models: [ ], wells: new Array(wellCount).fill(null), };
			while (sorted.length) {
				if (sorted[0].count > wellCount) { throw new Error('Not implemented'); }
				if (sorted[0].count > wellCount - addAt) { break; }
				addAt += addModelsToPlate(plate, addAt, sorted.shift()!);
			}
			while (sorted.length) {
				const index = sorted.findIndex(_=>_.count <= wellCount - addAt);
				if (index == -1) { break; }
				addAt += addModelsToPlate(plate, addAt, sorted.splice(index, 1)[0]);
			}
			plates.push(plate);
		}
	}
}

/// precondition: `models.count <= plate.wells.length - at`
function addModelsToPlate(plate: WellPlate<false>, at: uint, model: ModelGroup<false>): uint {
	plate.models.push(model);
	for (let index = 0; index < model.count; index++) {
		plate.wells[index + at] = { model, index, };
	} return model.count;
}

function generateInstructions(experiment: Experiment<false>): void {
	for (let index = 0; index < experiment.jobs.length; index++) {
		const job = experiment.jobs[index];
		job.instructions = [ ]; const { instructions, } = job;
		for (const model of experiment.models) {
			for (const operation of model.operations[index]) {
				switch (operation.type) {
					case 'AddMaterials': case 'SetTemp': case 'RemoveMaterial': case 'Mix': case 'Pause': case 'Module': {
						// TODO!
					}; break;
					case 'External': {
						// TODO!
					}; break;
					default: throw new TypeError;
				}
			}
		}
	}
}


class VariantTracker {
	private points: { name: string, limit: uint, last: uint, }[] = [ ];
	private index = 0;
	decide(name: string, limit: uint): uint {
		if (this.index >= this.points.length) {
			this.points.push({ name, limit, last: 0, });
			this.index = this.points.length;
			return 0;
		}
		const decision = this.points[this.index];
		if (decision.name != name) { throw new Error(`Variant decision point name mismatch (${name} != ${decision.name})`); }
		if (decision.limit != limit) { throw new Error(`Variant decision point limit mismatch (${limit} != ${decision.limit})`); }
		if (this.index == this.points.length - 1) {
			decision.last += 1;
		}
		this.index += 1;
		return decision.last;
	}
	finalize(): [ result: uint[], done: boolean, ] {
		if (this.index != this.points.length) { throw new Error(`Not all decision points were evaluated`); }
		this.index = 0;
		const result = this.points.map(_=>_.last);
		while (
			this.points.length && this.points[this.points.length - 1].last >= this.points[this.points.length - 1].limit
		) { this.points.pop(); }
		return [ result, this.points.length == 0, ];
	}
}

function * evalVariants<ResultT>(inner: (decide: VariantTracker['decide']) => ResultT): Generator<[ uint[], ResultT, ], void, never> {
	const tracker = new VariantTracker();
	while (true) {
		const result = inner(tracker.decide.bind(tracker));
		const [ decisions, done, ] = tracker.finalize();
		yield [ decisions, result, ];
		if (done) { return; }
	}
}
