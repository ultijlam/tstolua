import * as ts from "typescript";
import { LuaVisitor } from "../luavisitor";
import { PackageExtras } from "../package-extra";
import { expect } from "@jest/globals";

export class TestCompilerHost implements ts.CompilerHost {
    files = new Map<string, ts.SourceFile>();

    constructor(fileName: string, sourceFile: ts.SourceFile) {
        this.files.set(fileName, sourceFile);
    }

    getSourceFile(
        fileName: string,
        languageVersion: ts.ScriptTarget,
        onError?: ((message: string) => void) | undefined,
        shouldCreateNewSourceFile?: boolean | undefined
    ): ts.SourceFile | undefined {
        return this.files.get(fileName);
    }
    getDefaultLibFileName(options: ts.CompilerOptions): string {
        return "test";
    }
    writeFile: ts.WriteFileCallback = () => {};
    getCurrentDirectory(): string {
        return ".";
    }
    getDirectories(path: string): string[] {
        throw new Error("Method not implemented.");
    }
    getCanonicalFileName(fileName: string): string {
        return fileName;
    }
    useCaseSensitiveFileNames(): boolean {
        return true;
    }
    getNewLine(): string {
        throw new Error("Method not implemented.");
    }
    fileExists(fileName: string): boolean {
        return this.files.has(fileName);
    }
    readFile(fileName: string): string | undefined {
        throw new Error("Method not implemented.");
    }
}

export function testTransform(source: string, ignoreError: boolean = false, packageExtras?: PackageExtras) {
    const fileName = "source.ts";

    const sourceFile = ts.createSourceFile(
        fileName,
        source,
        ts.ScriptTarget.ES2015,
        true
    );
    sourceFile.moduleName = "./source";
    const host = new TestCompilerHost(fileName, sourceFile);
    const program = ts.createProgram(
        [fileName],
        {
            module: ts.ModuleKind.CommonJS,
            emitDecoratorMetadata: false,
            strict: true,
            lib: ["ES2015"],

        },
        host
    );
    expect(
        program.getSyntacticDiagnostics(sourceFile).map((x) => {
            return (
                x.messageText +
                " at " +
                (x.file &&
                    x.start &&
                    x.file.getLineAndCharacterOfPosition(x.start).line)
            );
        })
    ).toEqual([]);
    const visitor = new LuaVisitor(
        sourceFile,
        program.getTypeChecker(),
        1,
        "test",
        "",
        packageExtras ?? new PackageExtras()
    );
    visitor.traverse(sourceFile, 0, undefined);
    if (!ignoreError) expect(visitor.errors).toEqual([]);
    return visitor.getResult();
}
