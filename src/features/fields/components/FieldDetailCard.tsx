import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldWithObject } from "@/lib/knack/types/field";
import { isFormulaField } from "@/lib/knack/types/fields/formula";
import { getFormulaDisplay } from "../utils/formula";

interface FieldDetailCardProps {
  field: FieldWithObject;
}

export function FieldDetailCard({ field }: FieldDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Name</h3>
            <p>{field.name}</p>
          </div>
          <div>
            <h3 className="font-semibold">Key</h3>
            <p>{field.key}</p>
          </div>
          <div>
            <h3 className="font-semibold">Type</h3>
            <Badge variant="secondary">{field.type.replace(/_/g, " ")}</Badge>
          </div>
          <div>
            <h3 className="font-semibold">Object</h3>
            <p>{field.objectName}</p>
          </div>
          {isFormulaField(field) && (
            <div className="col-span-2">
              <h3 className="font-semibold">Formula</h3>
              <pre className="bg-muted p-2 rounded-md mt-1">
                {getFormulaDisplay(field)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
